import { ConsoleLogger } from '@nestjs/common';

export class CustomLoggerService extends ConsoleLogger {
  log(message: string, ...args: any[]) {
    super.log(message, ...args);
  }
  error(message: string, ...args: any[]) {
    super.error(message, ...args);
  }
  warn(message: string, ...args: any[]) {
    super.warn(message, ...args);
  }
  fatal(message: string, ...args: any[]) {
    super.fatal(message, ...args);
  }
}
