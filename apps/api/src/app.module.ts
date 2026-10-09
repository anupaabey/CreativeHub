import { MediaController } from './media/media.controller';
import { RecoveryController } from './auth/recovery.controller';
import { WorkspaceController } from './workspace/workspace.controller';
import { AdminController } from './workspace/admin.controller';
import { WorkspaceService } from './workspace/workspace.service';
import { Module,Controller,Get } from '@nestjs/common';
import { ThrottlerModule,ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import { AuthController } from './auth/auth.controller';
import { MarketplaceController } from './marketplace/marketplace.controller';
@Controller() class HealthController { @Get('health') health(){return {status:'ok',service:'creativehub-api'};} }
@Module({imports:[ThrottlerModule.forRoot([{ttl:60000,limit:60}])],controllers:[HealthController,AuthController,MarketplaceController,WorkspaceController,AdminController,RecoveryController,MediaController],providers:[PrismaService,WorkspaceService,{provide:APP_GUARD,useClass:ThrottlerGuard}]})
export class AppModule {}
