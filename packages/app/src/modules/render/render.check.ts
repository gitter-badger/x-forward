import { Logger } from '@nestjs/common'
import { setServers } from 'dns'
import { lookup } from 'dns/promises'
import { EnvEnum } from 'src/enums/EnvEnum'
import { getEnvSetting } from 'src/utils/env.util'
import { inspect } from 'util'
import { RenderModel } from './render.interface'

const dnsCheck = async ({ servers, upstreams }: RenderModel) => {
    if (getEnvSetting(EnvEnum.DNS_SERVERS)) {
        try {
            setServers(JSON.parse(getEnvSetting(EnvEnum.DNS_SERVERS)))
            Logger.verbose(`DNS Server 设置为: ${JSON.parse(getEnvSetting(EnvEnum.DNS_SERVERS))}`)
        } catch (e) {
            Logger.warn(`DNS: ${getEnvSetting(EnvEnum.DNS_SERVERS)}, 设置失败, 请检查是否满足 JSON 格式`)
        }
    }
    const parseMap = new Map()
    // handle servers
    for (let i = servers.length - 1; i >= 0; i--) {
        if (servers[i].proxy_pass.includes(':')) {
            let proxyPassSplit = servers[i].proxy_pass.split(':')
            if (!proxyPassSplit[0].match(/((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}/g)) {
                if (parseMap.has(proxyPassSplit[0])) {
                    if (!parseMap.get(proxyPassSplit[0])) {
                        Logger.warn(`${inspect(servers[i])}, DNS 解析失败, 将被移除`)
                        servers.splice(i, 1)
                    }
                } else {
                    try {
                        await lookup(proxyPassSplit[0])
                        parseMap.set(proxyPassSplit[0], true)
                    } catch (e) {
                        parseMap.set(proxyPassSplit[0], false)
                        Logger.warn(`${inspect(servers[i])}, DNS 解析失败, 将被移除`)
                        servers.splice(i, 1)
                    }
                }
            }
        } else {
            // handle upstream in servers
            let upstream = upstreams.find(u => u.name === servers[i].proxy_pass)
            if (upstream) {
                if (upstream.server) {
                    let upstreamServers = upstream.server
                    for (let j = upstreamServers.length - 1; j >= 0; j--) {
                        if (parseMap.has(upstreamServers[j].upstream_host)) {
                            if (!parseMap.get(upstreamServers[j].upstream_host)) {
                                Logger.warn(`${inspect(upstream.server[j])}, DNS 解析失败, 将被移除`)
                                upstream.server.splice(j, 1)
                            }
                        } else {
                            try {
                                await lookup(upstreamServers[j].upstream_host)
                                parseMap.set(upstreamServers[j].upstream_host, true)
                            } catch (e) {
                                parseMap.set(upstreamServers[j].upstream_host, false)
                                Logger.warn(`${inspect(upstream.server[j])}, DNS 解析失败, 将被移除`)
                                upstream.server.splice(j, 1)
                            }
                        }
                    }
                }
            } else {
                servers.splice(i, 1)
            }
        }
    }
    // handle upstreams
    for (let k = upstreams.length - 1; k >= 0; k--) {
        if (upstreams[k].server) {
            let upstreamServers = upstreams[k].server
            for (let n = upstreamServers.length - 1; n >= 0; n--) {
                if (parseMap.has(upstreamServers[n].upstream_host)) {
                    if (!parseMap.get(upstreamServers[n].upstream_host)) {
                        Logger.warn(`${inspect(upstreamServers[n])}, DNS 解析失败, 将被移除`)
                        upstreamServers.splice(n, 1)
                    }
                } else {
                    try {
                        await lookup(upstreamServers[n].upstream_host)
                        parseMap.set(upstreamServers[n].upstream_host, true)
                    } catch (e) {
                        parseMap.set(upstreamServers[n].upstream_host, false)
                        Logger.warn(`${inspect(upstreamServers[n])}, DNS 解析失败, 将被移除`)
                        upstreamServers.splice(n, 1)
                    }
                }
            }
        }
    }
    return {
        servers,
        upstreams
    }
}

// remove upstream.server.length <= 0
const upstreamServersCheck = ({ servers, upstreams }: RenderModel) => {
    upstreams = upstreams.filter(u => u.server.length > 0)
    servers.filter(s => {
        if (!s.proxy_pass.includes(':')) {
            if (upstreams.findIndex(u => u.name === s.proxy_pass) === -1) {
                Logger.warn(`upstream: ${s.proxy_pass} 未找到, 将被移除`)
                return false
            }
        }
        return true
    })
    return {
        servers,
        upstreams
    }
}

const uniqueLocalPortCheck = ({ servers, upstreams }: RenderModel) => {
    let localPorts = new Set()
    servers = servers.filter(s => {
        if (localPorts.has(s.listen_port)) {
            Logger.warn(`${inspect(s)}, 本地端口号: ${s.listen_port} 重复, 将被移除`)
            return false
        } else {
            localPorts.add(s.listen_port)
            return true
        }
    })
    return { servers, upstreams }
}

const uniqueUpstreamNameCheck = ({ servers, upstreams }: RenderModel) => {
    let upstreamNames = new Set()
    upstreams = upstreams.filter(s => {
        if (upstreamNames.has(s.name)) {
            Logger.warn(`${inspect(s)}, upstream_name: ${s.name} 重复, 将被移除`)
            return false
        } else {
            upstreamNames.add(s.name)
            return true
        }
    })
    return { servers, upstreams }
}

export const checkChain = async (render: RenderModel) => {
    return uniqueUpstreamNameCheck(upstreamServersCheck(await dnsCheck(uniqueLocalPortCheck(render))))
}
