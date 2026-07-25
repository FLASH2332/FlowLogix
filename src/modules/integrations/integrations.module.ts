import { Module, ConfigService } from '@nitrostack/core';
import { 
  VISION_SERVICE, 
  AIRTABLE_SERVICE, 
  SLACK_SERVICE, 
  GMAIL_SERVICE, 
  TOMTOM_SERVICE 
} from './integrations.types.js';
import { 
  MockVisionService, 
  MockAirtableService, 
  MockSlackService, 
  MockGmailService, 
  MockTomTomService 
} from './mock-services.js';

@Module({
  name: 'integrations',
  description: 'Provides external MCP integrations (Mock or Real)',
  providers: [
    {
      provide: VISION_SERVICE,
      useFactory: (config: ConfigService) => {
        // Example check: if (config.get('USE_MOCK_MCPS') !== 'false')
        return new MockVisionService(config.logger);
      },
      inject: [ConfigService]
    },
    {
      provide: AIRTABLE_SERVICE,
      useFactory: (config: ConfigService) => {
        return new MockAirtableService(config.logger);
      },
      inject: [ConfigService]
    },
    {
      provide: SLACK_SERVICE,
      useFactory: (config: ConfigService) => {
        return new MockSlackService(config.logger);
      },
      inject: [ConfigService]
    },
    {
      provide: GMAIL_SERVICE,
      useFactory: (config: ConfigService) => {
        return new MockGmailService(config.logger);
      },
      inject: [ConfigService]
    },
    {
      provide: TOMTOM_SERVICE,
      useFactory: (config: ConfigService) => {
        return new MockTomTomService(config.logger);
      },
      inject: [ConfigService]
    }
  ],
  exports: [
    VISION_SERVICE,
    AIRTABLE_SERVICE,
    SLACK_SERVICE,
    GMAIL_SERVICE,
    TOMTOM_SERVICE
  ]
})
export class IntegrationsModule {}
