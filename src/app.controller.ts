import { Controller, Get, Param } from '@nestjs/common';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';
import { promisify } from 'util';
import { AppService } from './app.service';

const execAsync = promisify(exec);

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/resetProfile/:profileName')
  async resetProfile(@Param('profileName') profileName: string) {
    console.log('received request to recreate profile named:', profileName);
    if (!profileName) {
      return { success: false, message: 'Profile name is required' };
    }

    try {
      // Step 1: Disconnect profile
      console.log('starting with killing profile ', profileName);
      await execAsync(`echo "kill ${profileName}" | nc -w 1 localhost 7505`);
      console.log(
        'profile ',
        profileName,
        'killed successfully, deleting certificates...',
      );
      // Step 2: Delete profile
      await execAsync(
        `export MENU_OPTION='3'; export CLIENT="${profileName}"; /root/openvpn-install.sh`,
      );
      console.log('Certificates deleted, generating new profile name');

      const newProfileName = this.generateUniqueProfileName(profileName);
      console.log(`New profile name: ${newProfileName} created`);
      // Step 3: Recreate profile
      await execAsync(
        `export MENU_OPTION='1'; export CLIENT="${newProfileName}"; export PASS="1"; /root/openvpn-install.sh`,
      );
      console.log('profile has been recreated');
      // Step 4: Read new profile config
      const configPath = `/root/${newProfileName}.ovpn`;
      const { stdout: newConfigFile } = await execAsync(`cat ${configPath}`);

      return { success: true, newProfileName, newConfigFile };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      return { success: false, message: error.message };
    }
  }

  private generateUniqueProfileName(profileName: string): string {
    const baseName = profileName.replace(/_.*$/, '');
    const uuidSuffix = randomUUID().slice(0, 12); // First 12 chars of UUID
    return `${baseName}_${uuidSuffix}`;
  }
}
