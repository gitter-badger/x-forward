import { AlipayCircleOutlined, LockOutlined, MobileOutlined, TaobaoCircleOutlined, UserOutlined, WeiboCircleOutlined } from '@ant-design/icons'
import { Alert, Space, message, Tabs } from 'antd'
import React, { useEffect, useState } from 'react'
import ProForm, { ProFormCaptcha, ProFormCheckbox, ProFormText } from '@ant-design/pro-form'
import { useIntl, Link, history, FormattedMessage, SelectLang, useModel } from 'umi'
import Footer from '@/components/Footer'
import { login } from '@/services/ant-design-pro/api'
import { getFakeCaptcha } from '@/services/ant-design-pro/login'
import figlet from 'figlet'
// @ts-ignore
import standard from 'figlet/importable-fonts/Standard.js'

import styles from './index.less'

figlet.parseFont('Standard', standard)

const LoginMessage: React.FC<{
    content: string
}> = ({ content }) => (
    <Alert
        style={{
            marginBottom: 24
        }}
        message={content}
        type="error"
        showIcon
    />
)

const Login: React.FC = () => {
    const [submitting, setSubmitting] = useState(false)
    const [userLoginState, setUserLoginState] = useState<API.LoginResult>({})
    const [type, setType] = useState<string>('account')
    const { initialState, setInitialState } = useModel('@@initialState')

    useEffect(() => {
        figlet.text('X-Forward', 'Standard', (error, result) => {
            if (error) {
                return
            }
            console.log(result)
        })
    }, [])

    const intl = useIntl()

    const fetchUserInfo = async () => {
        const userInfo = await initialState?.fetchUserInfo?.()
        if (userInfo) {
            await setInitialState(s => ({
                ...s,
                currentUser: userInfo
            }))
        }
    }

    const handleSubmit = async (values: API.LoginParams) => {
        setSubmitting(true)
        try {
            // 登录
            const msg = await login({ ...values, type })
            if (msg.status === 'ok') {
                const defaultLoginSuccessMessage = intl.formatMessage({
                    id: 'pages.login.success',
                    defaultMessage: '登录成功！'
                })
                message.success(defaultLoginSuccessMessage)
                await fetchUserInfo()
                /** 此方法会跳转到 redirect 参数所在的位置 */
                if (!history) return
                const { query } = history.location
                const { redirect } = query as { redirect: string }
                history.push(redirect || '/')
                return
            }
            // 如果失败去设置用户错误信息
            setUserLoginState(msg)
        } catch (error) {
            const defaultLoginFailureMessage = intl.formatMessage({
                id: 'pages.login.failure',
                defaultMessage: '登录失败，请重试！'
            })

            message.error(defaultLoginFailureMessage)
        }
        setSubmitting(false)
    }
    const { status, type: loginType } = userLoginState

    return (
        <div className={styles.container}>
            <div className={styles.lang} data-lang>
                {SelectLang && <SelectLang />}
            </div>
            <div className={styles.content}>
                <div className={styles.top}>
                    <div className={styles.header}>
                        <Link to="/">
                            <img alt="logo" className={styles.logo} src="/logo.svg" />
                            <span className={styles.title}>Ant Design</span>
                        </Link>
                    </div>
                    <div className={styles.desc}>{intl.formatMessage({ id: 'pages.layouts.userLayout.title' })}</div>
                </div>

                <div className={styles.main}>
                    <ProForm
                        initialValues={{
                            autoLogin: true
                        }}
                        submitter={{
                            searchConfig: {
                                submitText: intl.formatMessage({
                                    id: 'pages.login.submit',
                                    defaultMessage: '登录'
                                })
                            },
                            render: (_, dom) => dom.pop(),
                            submitButtonProps: {
                                loading: submitting,
                                size: 'large',
                                style: {
                                    width: '100%'
                                }
                            }
                        }}
                        onFinish={async values => {
                            await handleSubmit(values as API.LoginParams)
                        }}
                    >
                        <Tabs activeKey={type} onChange={setType}>
                            <Tabs.TabPane
                                key="account"
                                tab={intl.formatMessage({
                                    id: 'pages.login.accountLogin.tab',
                                    defaultMessage: '账户密码登录'
                                })}
                            />
                            <Tabs.TabPane
                                key="mobile"
                                tab={intl.formatMessage({
                                    id: 'pages.login.phoneLogin.tab',
                                    defaultMessage: '手机号登录'
                                })}
                            />
                        </Tabs>

                        {status === 'error' && loginType === 'account' && (
                            <LoginMessage
                                content={intl.formatMessage({
                                    id: 'pages.login.accountLogin.errorMessage',
                                    defaultMessage: '账户或密码错误(admin/admin)'
                                })}
                            />
                        )}
                        {type === 'account' && (
                            <>
                                <ProFormText
                                    name="username"
                                    fieldProps={{
                                        size: 'large',
                                        prefix: <UserOutlined className={styles.prefixIcon} />
                                    }}
                                    placeholder={intl.formatMessage({
                                        id: 'pages.login.username.placeholder',
                                        defaultMessage: '用户名: admin or user'
                                    })}
                                    rules={[
                                        {
                                            required: true,
                                            message: <FormattedMessage id="pages.login.username.required" defaultMessage="请输入用户名!" />
                                        }
                                    ]}
                                />
                                <ProFormText.Password
                                    name="password"
                                    fieldProps={{
                                        size: 'large',
                                        prefix: <LockOutlined className={styles.prefixIcon} />
                                    }}
                                    placeholder={intl.formatMessage({
                                        id: 'pages.login.password.placeholder',
                                        defaultMessage: '密码: admin or user'
                                    })}
                                    rules={[
                                        {
                                            required: true,
                                            message: <FormattedMessage id="pages.login.password.required" defaultMessage="请输入密码！" />
                                        }
                                    ]}
                                />
                            </>
                        )}

                        {status === 'error' && loginType === 'mobile' && <LoginMessage content="验证码错误" />}
                        {type === 'mobile' && (
                            <>
                                <ProFormText
                                    fieldProps={{
                                        size: 'large',
                                        prefix: <MobileOutlined className={styles.prefixIcon} />
                                    }}
                                    name="mobile"
                                    placeholder={intl.formatMessage({
                                        id: 'pages.login.phoneNumber.placeholder',
                                        defaultMessage: '手机号'
                                    })}
                                    rules={[
                                        {
                                            required: true,
                                            message: <FormattedMessage id="pages.login.phoneNumber.required" defaultMessage="请输入手机号！" />
                                        },
                                        {
                                            pattern: /^1\d{10}$/,
                                            message: <FormattedMessage id="pages.login.phoneNumber.invalid" defaultMessage="手机号格式错误！" />
                                        }
                                    ]}
                                />
                                <ProFormCaptcha
                                    fieldProps={{
                                        size: 'large',
                                        prefix: <LockOutlined className={styles.prefixIcon} />
                                    }}
                                    captchaProps={{
                                        size: 'large'
                                    }}
                                    placeholder={intl.formatMessage({
                                        id: 'pages.login.captcha.placeholder',
                                        defaultMessage: '请输入验证码'
                                    })}
                                    captchaTextRender={(timing, count) => {
                                        if (timing) {
                                            return `${count} ${intl.formatMessage({
                                                id: 'pages.getCaptchaSecondText',
                                                defaultMessage: '获取验证码'
                                            })}`
                                        }
                                        return intl.formatMessage({
                                            id: 'pages.login.phoneLogin.getVerificationCode',
                                            defaultMessage: '获取验证码'
                                        })
                                    }}
                                    name="captcha"
                                    rules={[
                                        {
                                            required: true,
                                            message: <FormattedMessage id="pages.login.captcha.required" defaultMessage="请输入验证码！" />
                                        }
                                    ]}
                                    onGetCaptcha={async phone => {
                                        const result = await getFakeCaptcha({
                                            phone
                                        })
                                        if (result === false) {
                                            return
                                        }
                                        message.success('获取验证码成功！验证码为：1234')
                                    }}
                                />
                            </>
                        )}
                        <div
                            style={{
                                marginBottom: 24
                            }}
                        >
                            <ProFormCheckbox noStyle name="autoLogin">
                                <FormattedMessage id="pages.login.rememberMe" defaultMessage="自动登录" />
                            </ProFormCheckbox>
                            <a
                                style={{
                                    float: 'right'
                                }}
                            >
                                <FormattedMessage id="pages.login.forgotPassword" defaultMessage="忘记密码" />
                            </a>
                        </div>
                    </ProForm>
                    <Space className={styles.other}>
                        <FormattedMessage id="pages.login.loginWith" defaultMessage="其他登录方式" />
                        <AlipayCircleOutlined className={styles.icon} />
                        <TaobaoCircleOutlined className={styles.icon} />
                        <WeiboCircleOutlined className={styles.icon} />
                    </Space>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Login
