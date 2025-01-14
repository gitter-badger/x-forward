import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Optimized, Preprocess } from 'src/decorators/args.decorator'
import { StateEnum } from 'src/enums/StatusEnum'
import { Repository } from 'typeorm'
import { EventService } from '../event/event.service'
import { StreamEntity } from './stream.entity'

@Injectable()
export class StreamService {
    constructor(
        @InjectRepository(StreamEntity)
        private streamRepository: Repository<StreamEntity>,
        private readonly eventService: EventService
    ) {}

    /**
     * 获取所有 stream 规则
     * 排除 delete_time 不为空的记录
     * @returns StreamEntity[]
     */
    async findAll(): Promise<StreamEntity[]> {
        return this.streamRepository.find({ loadRelationIds: true })
    }

    /**
     * find record which fk is null
     * @returns StreamEntity[]
     */
    async findNullFK() {
        return this.streamRepository
            .createQueryBuilder()
            .select('stream')
            .from(StreamEntity, 'stream')
            .where('stream.upstream_id IS NULL')
            .andWhere('stream.state = :state', { state: StateEnum.Able })
            .getMany()
    }

    /**
     * 添加 stream 规则
     * @param streamEntity Stream
     * @returns StreamEntity
     */
    async create(streamEntity: StreamEntity) {
        let res = await this.streamRepository.save(streamEntity)
        this.eventService.triggerCreateEvent()
        return res
    }

    /**
     * 批量添加 stream 规则
     * @param streamEntities Stream[]
     * @returns StreamEntity[]
     */
    async createAll(streamEntities: StreamEntity[]) {
        return this.streamRepository.save(streamEntities)
    }

    /**
     * 更新 stream 的 state 状态
     * typeorm + sqlite 无法正确返回 affect rows https://github.com/typeorm/typeorm/issues/7374
     * 2021.10.24 更换为 better-sqlite3, 可以正确返回 affect rows
     * @param id streamID
     * @param state state
     * @returns UpdateResult
     */
    stateUpdate(id: number, state: number) {
        return this.streamRepository.update(id, { state: state })
    }

    @Preprocess()
    async update(id: string, @Optimized() streamEntity: StreamEntity) {
        let res = await this.streamRepository.update(id, streamEntity)
        return res
    }

    updateAll(streamEntities: StreamEntity[]) {
        return streamEntities.map(s => this.update(s.id, s))
    }

    /**
     * 更新 delete_time 字段
     * @param id primary key
     */
    delete(id: string) {
        let res = this.streamRepository.softDelete(id)
        this.eventService.triggerDeleteEvent()
        return res
    }

    /**
     * 更新所有记录的 delete_time
     * @returns affect rows
     */
    async deleteAll() {
        let res = await this.streamRepository.createQueryBuilder().update(StreamEntity).set({ deleteTime: new Date() }).where('delete_time is NULL').execute()
        this.eventService.triggerDeleteEvent()
        return res
    }

    async removeByFK(id: string) {
        let res = await this.streamRepository.createQueryBuilder().softDelete().from(StreamEntity).where('upstream_id = :id', { id }).execute()
        this.eventService.triggerDeleteEvent()
        return res
    }
}
