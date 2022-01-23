
const doc_keyUp = (e) => {
    if (e.ctrlKey && (e.key === 'c') || e.key === 'C' || e.key === 'ב') {
        // call your function to do the thing
        grab_action()
    }
}

const grab_action = async () => {
    console.log("sdfgr");
    let asin = link_analyze(window.location.href)
    let stxt = ""
    await chrome.storage.sync.get('grabStorage', (result) => {
        stxt = result.grabStorage
        if (!stxt.includes(asin)) {
            if (stxt) {
                stxt = asin + ',\n' + stxt
            } else stxt = asin
            chrome.storage.sync.set({ 'grabStorage': stxt }, () => { });
            alert('item grabbed successfully')
        } else {
            alert('item is already grabbed')
        }
    })
}

const link_analyze = (link) => {
    let l1 = 0
    let asin = ""
    if (link.includes('dp')) {
        link = link.split(/[/?]+/)
        for (let i = 0; i < link.length; i++) {
            if (link[i] == "dp") {
                l1 = i + 1
                i = link.length
            }
        }
        asin = link[l1]
    } else if (link.includes('gp/product')) {
        link = link.split(/[/?]+/)
        // link = link.split('?')
        for (let i = 0; i < link.length; i++) {
            if (link[i] == "product") {
                l1 = i + 1
                i = link.length
            }
        }
        asin = link[l1]
    }
    return asin
}


const copy_grabstorage = () => {
    chrome.storage.sync.get('grabStorage', (result) => {
        navigator.clipboard.writeText(result.grabStorage)
    })
}

const get_storage = async (key) => {
    chrome.storage.sync.get(key, (result) => {
        return result
    })
}


window.onload = () => {
    const prime_el = Array.from(document.querySelectorAll(`#desktop_qualifiedBuyBox a`)).concat(Array.from(document.querySelectorAll(`#deliveryBlock_feature_div a`)))
    let isprime = null
    for (let i = 0; i < prime_el.length; i++) {
        if (prime_el[i].firstChild && prime_el[i].firstChild.data && prime_el[i].firstChild.data.trim().toLowerCase().includes("free delivery".toLowerCase())) {
            is_prime = true
            true_prime_el = prime_el[i]
            i = prime_el.length
        }
    }
    // let isprime = document.getElementById('priceBadging_feature_div').innerHTML.toLowerCase().includes('prime')
    chrome.storage.sync.get('settingStorage', async (result) => {
        if ((window.location.href.includes('gb/product') || window.location.href.includes('/dp/')) && (result.settingStorage && result.settingStorage.show)) {
            if (result.settingStorage.prime) {
                if (isprime) {
                    let html = []
                    let t = document.getElementById('titleSection').innerHTML
                    if (!t)
                        t = document.getElementById('title').innerHTML
                    await html.push('<button type="button" style="position:relative; border-radius:20px; font-size:20px; background-color:#636363; border:unset; padding: 5px; padding-right: 20px; padding-left: 20px;" id="btnGrab">grab</button>')
                    await html.push(t)
                    t = await html.join(' ')
                    document.getElementById('titleSection').innerHTML = t
                    document.getElementById('btnGrab').addEventListener('click', grab_action)
                    document.addEventListener('keyup', doc_keyUp, false);
                }
            }
            else {
                let html = []
                let t = document.getElementById('titleSection').innerHTML
                if (!t)
                    t = document.getElementById('title').innerHTML
                await html.push('<button type="button" style="position:relative; border-radius:20px; font-size:20px; background-color:#636363; border:unset; padding: 5px; padding-right: 20px; padding-left: 20px;" id="btnGrab">grab</button>')
                await html.push(t)
                t = await html.join(' ')
                document.getElementById('titleSection').innerHTML = t
                document.getElementById('btnGrab').addEventListener('click', grab_action)
                document.addEventListener('keyup', doc_keyUp, false);
            }

        }
    })
}
