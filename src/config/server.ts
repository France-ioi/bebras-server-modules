export default {
    port: 3000,
    request_max_size: 1000000,
    dev_mode: !!process.env.DEV_MODE,
    dev_user_id: process.env.DEV_USER_ID,
    dev_platform_name: process.env.DEV_PLATFORM_NAME,
}
