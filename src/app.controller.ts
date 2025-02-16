import { Controller, Get, Param } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AppService } from './app.service';

const execAsync = promisify(exec);

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/resetProfile/:profileName')
  async resetProfile(@Param('profileName') profileName: string) {
    if (!profileName) {
      return { success: false, message: 'Profile name is required' };
    }

    try {
      // Step 1: Disconnect profile
      await execAsync(`echo "kill ${profileName}" | nc localhost 7505`);

      // Step 2: Delete profile
      await execAsync(
        `export MENU_OPTION='3'; export CLIENT="${profileName}"; ./openvpn-install.sh`,
      );

      // Step 3: Recreate profile
      await execAsync(
        `export MENU_OPTION='1'; export CLIENT="${profileName}"; export PASS="1"; ./openvpn-install.sh`,
      );

      // Step 4: Read new profile config
      const configPath = `/root/${profileName}.ovpn`;
      const { stdout: configFile } = await execAsync(`cat ${configPath}`);

      return { success: true, profileName, configFile };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      return { success: false, message: error.message };
    }
  }
}
