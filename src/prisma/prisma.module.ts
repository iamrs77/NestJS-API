import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// this module will helps other modules to connect with DB so basically its bridge between
// our modules and prisma

@Global() // this annotation hellps us to make the module global, that avoid manual imports in other modules
@Module({
    providers: [PrismaService],
    exports: [PrismaService], // this is used so that this service can be used in other modules
})
export class PrismaModule {}
