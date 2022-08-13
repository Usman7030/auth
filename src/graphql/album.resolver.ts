import { NotFoundException } from '@nestjs/common';
import {
  Args,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

import { Field, InputType } from '@nestjs/graphql';
import { AlbumsService } from './album.service';
import { Resource } from '../lib/resource.decorator';
import { Scopes } from 'nest-keycloak-connect';

@ObjectType()
@InputType('AlbumInput')
class Album {
  @Field()
  id: string;

  @Field()
  name: string;
}

@Resolver(() => Album)
export class AlbumsResolver {
  constructor(private readonly albumsService: AlbumsService) {}

  @Query(() => Album)
  @Resource({ key: 'id' })
  @Scopes('album:view')
  async album(@Args('id') id: string): Promise<Album> {
    return {
      id: 'dummy',
      name: 'dummy',
    };
  }

  // @Query((returns) => [Album])
  // albums(@Args() albumsArgs: AlbumsArgs): Promise<Album[]> {
  //   return this.albumsService.findAll(albumsArgs);
  // }

  // @Mutation((returns) => Album)
  // async addAlbum(
  //   @Args('newAlbumData') newAlbumData: NewAlbumInput,
  // ): Promise<Album> {
  //   const album = await this.albumsService.create(newAlbumData);
  //   pubSub.publish('albumAdded', { albumAdded: album });
  //   return album;
  // }

  // @Mutation((returns) => Boolean)
  // async removeAlbum(@Args('id') id: string) {
  //   return this.albumsService.remove(id);
  // }

  // @Subscription((returns) => Album)
  // albumAdded() {
  //   return pubSub.asyncIterator('albumAdded');
  // }
}
