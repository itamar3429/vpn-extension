window.onload = async () => {
    const get_storage = async (key, func) => {
        await chrome.storage.sync.get(key, async (result) => {
            await func(result[key])
        })
    }

    const set_storage = (key, val) => {
        let value = {}
        value[key] = val
        chrome.storage.sync.set(value)
    }

    let alertQ = 0;
    const setalert = (textv) => {
        alertQ++
        let alertQT = alertQ
        document.getElementById('alert').innerText = textv
        document.getElementById('alert').classList.add('showalert')
        document.getElementById('alert').classList.add('alertop')
        setTimeout(() => {
            if (alertQ == alertQT) {
                document.getElementById('alert').classList.remove('alertop')
            }
        }, 7000)
        setTimeout(() => {
            if (alertQ == alertQT) {
                document.getElementById('alert').classList.remove('showalert')
            }
        }, 9000)
    }

    const loadF = async (cb) => {
        await new Promise(async (res) => {
            await get_storage('proxy_list', (val) => {
                console.log(val);
                let result = null
                result = val
                if (result && result.length) {
                    try {
                        let options = `<option value="null" id="optionss" selected >select proxy</option>`
                        result.forEach(re => {
                            let s = re.last ? 'selected' : ''
                            if (s)
                                options.replaceAll('selected', '')
                            options += `<option value="${JSON.stringify(re).replaceAll('"', "'")}" id="ipOption" ${s}>${re.ip}:${re.port}</option>`
                        });
                        document.getElementById('savedSelect').innerHTML = options

                        document.querySelector('#savedSelect').addEventListener('change', async (e) => {

                            if (e.target.value != 'null') {
                                let proxy = JSON.parse(e.target.value.replaceAll("'", '"'))
                                document.querySelector('#ip').value = proxy.ip
                                document.querySelector('#port').value = proxy.port
                                document.querySelector('#username').value = proxy.username
                                document.querySelector('#password').value = proxy.password
                                setalert(`proxy changed, for the change to take affect please press set`)
                            } else {
                                setalert(`select proxy`)
                                document.querySelector('#ip').value = ''
                                document.querySelector('#port').value = ''
                                document.querySelector('#username').value = ''
                                document.querySelector('#password').value = ''
                            }
                        })
                    } catch (err) {
                        console.log(err);
                    }
                    if (result.filter(x => x.last === true).length > 0)
                        result = result.filter(x => x.last === true)[0]
                    else
                        result = result[0]
                    document.querySelector('#ip').value = result.ip
                    document.querySelector('#port').value = result.port
                    document.querySelector('#username').value = result.username
                    document.querySelector('#password').value = result.password
                } else {
                    options = `<option value="null" id="optionss">no proxy saved</option>`
                    document.getElementById('savedSelect').innerHTML = options
                }
                res(true)
            })
        }).then(async () => {
            await chrome.proxy.settings.get({
                    'incognito': false
                },
                function (config) {
                    if (config.value.rules && config.value.rules.singleProxy) {
                        let d = config.value.rules.singleProxy
                        document.getElementById('currentProxy').innerText = `proxy is listening on:\n  ${d.host} : ${d.port}`
                    } else {
                        document.getElementById('currentProxy').innerText = `proxy is not active`
                    }
                }
            );
            if (cb) {
                await cb()
            }
        })



    }

    await loadF()

    const setProxy = async (opt = {
        ip,
        port,
        username,
        password,
        singleProxy
    }, cb) => {
        try {
            new Promise(async (resolve) => {
                if (opt.username && opt.password) {

                    // chrome.tabs.query({}, function (tabs) {
                    //     console.log(tabs);
                    //     console.log('log tabs');
                    //     for (let i = 0; i < tabs.length; i++) {
                    //         chrome.tabs.sendMessage(tabs[i].id, {
                    //             data: opt
                    //         }, function (response) {
                    //             if (response && response.success)
                    //                 setalert('listener added')
                    //             else {
                    //                 setalert('failed to send messgae')
                    //             }
                    //         });
                    //     }
                    // });
                    chrome.runtime.sendMessage({
                        data: opt
                    }, function (response) {
                        if (response)
                            setalert(response)

                    });

                    // await chrome.webRequest.onAuthRequired.addListener((details) => {
                    //         console.log("onAuthRequired!", details);
                    //         let credentials = {
                    //             username: opt.username,
                    //             password: opt.password
                    //         }
                    //         return {
                    //             authCredentials: credentials
                    //         }

                    //     }, {
                    //         urls: ["<all_urls>"]
                    //     },
                    //     ['blocking']
                    // );
                    // chrome.webRequest.onCompleted.addListener(
                    //     () => {
                    //         setalert('proxy credentials set')
                    //     }, {
                    //         urls: ["<all_urls>"]
                    //     }
                    // );
                }
                var config = null
                if (opt.ip && opt.port) {
                    await chrome.proxy.settings.set({
                        value: {
                            mode: 'direct'
                        },
                        scope: 'regular'
                    });
                    config = {
                        mode: "fixed_servers",
                        rules: {
                            singleProxy: {
                                host: opt.ip,
                                port: opt.port ? parseInt(opt.port) : null,
                            }
                        }
                    };
                    await chrome.proxy.settings.set({
                        value: config,
                        scope: 'regular'
                    });
                    setalert(`proxy set to: ${opt.ip}:${opt.port}`)
                    resolve(true)
                } else {
                    setalert(`please select ip and port`)
                    resolve(false)
                }
            }).then((val) => {
                if (val && cb) {
                    cb()
                }
            })
        } catch (error) {
            setalert(`error while setting proxy: ${error.message}`)
            if (cb) {
                await cb()
            }
            resolve()
        }
    }


    document.querySelector('#btnSetProxy').addEventListener('click', async (e) => {
        await get_storage('proxy_list', async (val) => {
            console.log(val);
            let ip = document.querySelector('#ip').value
            let port = document.querySelector('#port').value
            let username = document.querySelector('#username').value
            let password = document.querySelector('#password').value
            let singleProxy = document.querySelector('#single').value
            if (ip && port) {
                if (val && val.length && val.filter(x => x.ip == ip && x.port == port && x.username == username && x.password == password).length == 0) { //see if i need to insert new value
                    val.map(x => x.last = false)
                    val.push({
                        ip,
                        port,
                        username,
                        password,
                        last: true
                    })
                } else
                if (val && val.length) {
                    val.map(x => {
                        if (x.ip == ip && x.port == port && x.username == username && x.password == password)
                            x.last = true
                        else
                            x.last = false
                    })
                } else {
                    val = [{
                        ip,
                        port,
                        username,
                        password,
                        last: true
                    }]
                }
            }
            console.log(val);
            await set_storage('proxy_list', val)
            new Promise(async (res) => {
                await setProxy({
                    ip,
                    port,
                    username,
                    password,
                    singleProxy
                }, res)
            }).then(async () => {
                await loadF()
            })

            // alert(`ip is : ${ip}, \n port is: ${port}, \n username is : ${username}, \n password is: ${password}`)
            console.log(`ip is : ${ip}, \n port is: ${port}, \n username is : ${username}, \n password is: ${password}`);
        })
    })

    document.querySelector('#btnClearProxy').addEventListener('click', async (e) => {
        await chrome.proxy.settings.set({
            value: {
                mode: 'direct'
            },
            scope: 'regular'
        });
        await new Promise(async (res, rej) => {
            await loadF(res)
        }).then(() => {
            document.querySelector('#ip').value = ''
            document.querySelector('#port').value = ''
            document.querySelector('#username').value = ''
            document.querySelector('#password').value = ''
        })
        let options = document.getElementById('savedSelect').innerHTML
        options = options.split('<option').map(x => x = '<option' + x.replaceAll('selected', '')).filter(x => !x.includes('select proxy<'))
        options = `<option value="null" id="optionss" selected >select proxy</option>` + options.join(' ')
        document.getElementById('savedSelect').innerHTML = options
        setalert(`proxy cleared`)
    })


    document.querySelector('#btnDeleteProxy').addEventListener('click', async (e) => {
        try {
            let ip = document.querySelector('#ip').value
            let port = document.querySelector('#port').value
            let username = document.querySelector('#username').value
            let password = document.querySelector('#password').value
            await get_storage('proxy_list', async (val) => {
                if (val.length) {
                    val = val.filter(x => !(x.ip == ip && x.port == port && x.username == username && x.password == password))
                }
                await set_storage('proxy_list', val)
                await new Promise(async (res, rej) => {
                    await loadF()
                    res(true)
                }).then(() => {
                    document.querySelector('#ip').value = ''
                    document.querySelector('#port').value = ''
                    document.querySelector('#username').value = ''
                    document.querySelector('#password').value = ''
                })

                await chrome.proxy.settings.set({
                    value: {
                        mode: 'direct'
                    },
                    scope: 'regular'
                });
                setalert(`proxy deleted to deactivate current proxy press clear`)
            })
        } catch (error) {
            setalert(`error while deleting: ${error.message}`)
        }
    })
}