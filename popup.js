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
            if (alertQ == alertQT) { document.getElementById('alert').classList.remove('alertop') }
        }, 7000)
        setTimeout(() => {
            if (alertQ == alertQT) { document.getElementById('alert').classList.remove('showalert') }
        }, 9000)
    }

    await get_storage('proxy_list', async (val) => {
        console.log(val);
        let result = null
        result = val
        if (result && result.length) {
            try {
                let options = ''
                result.forEach(re => {
                    let s = re.last ? 'selected' : ''
                    options += `<option value="${JSON.stringify(re).replaceAll('"', "'")}" id="ipOption" ${s}>${re.ip}:${re.port}</option>`
                });
                document.getElementById('savedSelect').innerHTML = options

                document.querySelector('#savedSelect').addEventListener('change', async (e) => {
                    let proxy = JSON.parse(e.target.value.replaceAll("'", '"'))
                    document.querySelector('#ip').value = proxy.ip
                    document.querySelector('#port').value = proxy.port
                    document.querySelector('#username').value = proxy.username
                    document.querySelector('#password').value = proxy.password
                    setalert(`proxy changed`)
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
            options = `<option value="0" id="optionss">no proxy saved</option>`
            document.getElementById('savedSelect').innerHTML = options
        }
    })

    const setProxy = async (opt = { ip, port, username, password, singleProxy }) => {
        try {
            await chrome.proxy.settings.clear({});
            await chrome.webRequest.onAuthRequired.addListener(
                function (details, callbackFn) {
                    console.log("onAuthRequired!", details, callbackFn);
                    callbackFn({
                        authCredentials: { username, password }
                    });
                },
                { urls: ["<all_urls>"] },
                ['asyncBlocking']
            );
            var config = null
            if (opt.ip && opt.port) {
                config = {
                    mode: "fixed_servers",
                    rules: {
                        singleProxy: {
                            host: opt.ip,
                            port: opt.port ? parseInt(opt.port) : null,
                        }
                    }
                };
                await chrome.proxy.settings.set({ value: config, scope: 'regular' });
                setalert(`proxy set to: ${opt.ip}:${opt.port}`)
            } else setalert(`please select ip and port`)
        } catch (error) {
            setalert(`error while setting proxy: ${error.message}`)
        }
    }

    chrome.proxy.settings.get(
        { 'incognito': false },
        function (config) {
            if (config.value.rules) {
                let d = config.value.rules.singleProxy
                document.getElementById('currentProxy').innerText = `proxy is listening on:\n  ${d.host} : ${d.port}`
            }
            else {
                document.getElementById('currentProxy').innerText = `proxy is not active`
            }
        }
    );

    document.querySelector('#btnSetProxy').addEventListener('click', async (e) => {
        await get_storage('proxy_list', async (val) => {
            console.log(val);
            let ip = document.querySelector('#ip').value
            let port = document.querySelector('#port').value
            let username = document.querySelector('#username').value
            let password = document.querySelector('#password').value
            let singleProxy = document.querySelector('#single').value
            if (val && val.length && val.filter(x => x.ip == ip && x.port == port && x.username == username && x.password == password).length == 0) { //see if i need to insert new value
                val.map(x => x.last = false)
                val.push({ ip, port, username, password, last: true })
            }
            else if (val && val.length) {
                val.map(x => {
                    if (x.ip == ip && x.port == port && x.username == username && x.password == password)
                        x.last = true
                    else
                        x.last = false
                })
            } else {
                val = [{ ip, port, username, password, last: true }]
            }
            console.log(val);
            await set_storage('proxy_list', val)
            await setProxy({ ip, port, username, password, singleProxy })
            // alert(`ip is : ${ip}, \n port is: ${port}, \n username is : ${username}, \n password is: ${password}`)
            console.log(`ip is : ${ip}, \n port is: ${port}, \n username is : ${username}, \n password is: ${password}`);
        })
    })

    document.querySelector('#btnClearProxy').addEventListener('click', async (e) => {
        document.querySelector('#ip').value = ''
        document.querySelector('#port').value = ''
        document.querySelector('#username').value = ''
        document.querySelector('#password').value = ''
        await chrome.proxy.settings.clear({});
        document.getElementById('currentProxy').innerText = `proxy is not active`
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
                document.querySelector('#ip').value = ''
                document.querySelector('#port').value = ''
                document.querySelector('#username').value = ''
                document.querySelector('#password').value = ''
                await chrome.proxy.settings.clear({});
                setalert(`proxy deleted to deactivate current proxy press clear`)
            })
        }
        catch (error) {
            setalert(`error while deleting: ${error.message}`)
        }
    })
}
