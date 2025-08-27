import { CORE_START_FAILED, CORE_STARTED, CORE_STARTING, CORE_STOP_FAILED, CORE_STOPPED, CORE_STOPPING, SkerCore } from '../dist/index.js'


async function bootstrap() {

    const sker = new SkerCore({
        serviceName: `sker-demo`,
        version: `1.0.0`
    })
    sker.on(CORE_STARTING, () => {
        console.log(`starting`)
    })
    sker.on(CORE_STARTED, ()=>{
        console.log(`started`)
    })
    sker.on(CORE_START_FAILED, ()=>{
        console.log(`startFailed`)
    })

    sker.on(CORE_STOPPING, ()=>{
        console.log(`stopping`)
    })
    sker.on(CORE_STOPPED, ()=>{
        console.log(`stopped`)
    })
    sker.on(CORE_STOP_FAILED, ()=>{
        console.log(`stopFailed`)
    })
    await sker.start()
    
    await sker.restart()

    await sker.stop()
}


bootstrap()