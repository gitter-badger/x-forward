import { AutoMap } from '@automapper/classes'
import { CommonEntity } from 'src/common/common.entity'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { UpstreamEntity } from '../../upstream.entity'

@Entity('server')
export class ServerEntity extends CommonEntity {
    @AutoMap()
    @Column({ name: 'upstream_host', type: 'varchar' })
    upstreamHost: string

    @AutoMap()
    @Column({ name: 'upstream_port', type: 'smallint' })
    upstreamPort: number

    // 设置服务器的权重，默认情况下为 1。
    @AutoMap()
    @Column({ type: 'tinyint', nullable: true })
    weight?: number

    // 限制到被代理服务器的最大同时连接数（1.11.5）。默认值为零，表示没有限制。如果服务器组未驻留在共享内存中，则此限制在每个 worker 进程中均有效。

    @AutoMap()
    @Column({ name: 'max_conns', type: 'smallint', nullable: true })
    maxConns?: number

    // 设置在 fail_timeout 参数设置的时间内与服务器通信的失败尝试次数，以便认定服务器在 fail_timeout 参数设置的时间内不可用。默认情况下，失败尝试的次数设置为 1。零值将禁用尝试记录。在这里，当与服务器正在建立连接中，失败尝试将是一个错误或超时。
    @AutoMap()
    @Column({ name: 'max_fails', type: 'int', nullable: true })
    maxFails?: number

    // 在时间范围内与服务器通信的失败尝试达到指定次数，应将服务器视为不可用,默认情况下，该参数设置为 10 秒。
    @AutoMap()
    @Column({ name: 'fail_timeout', type: 'varchar', nullable: true })
    failTimeout?: string

    // 将服务器标记为备用服务器。当主服务器不可用时，连接将传递到备用服务器。
    // 该参数不能与 hash 和 random 负载均衡算法一起使用。
    @AutoMap()
    @Column({ type: 'tinyint', nullable: true })
    backup?: 0 | 1

    // 将服务器标记为永久不可用。
    @AutoMap()
    @Column({ type: 'tinyint', nullable: true })
    down?: 0 | 1

    @ManyToOne(() => UpstreamEntity, upstream => upstream.server, { createForeignKeyConstraints: false })
    @JoinColumn({ name: 'upstream_id' })
    upstream?: UpstreamEntity
}
