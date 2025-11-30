import { Module, Global } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { DiscordService } from './services/discord.service';
import { TwilioService } from './services/twilio.service';

@Global()
@Module({
  providers: [EmailService, DiscordService, TwilioService],
  exports: [EmailService, DiscordService, TwilioService],
})
export class CommonModule {}

