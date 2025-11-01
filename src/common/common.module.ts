import { Module, Global } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { DiscordService } from './services/discord.service';

@Global()
@Module({
  providers: [EmailService, DiscordService],
  exports: [EmailService, DiscordService],
})
export class CommonModule {}

