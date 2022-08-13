import { Module } from '@nestjs/common';
import { AlbumsResolver } from './album.resolver';
import { AlbumsService } from './album.service';

@Module({
  providers: [AlbumsResolver, AlbumsService],
})
export class AlbumsModule {}
