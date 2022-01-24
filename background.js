window.onload = async () => {

    const set_credentials = async (opt = {
        username,
        password
    }, sender, sendResponse) => {
        await new Promise(async (res) => {
            console.log(sender.url);
            if (opt.username && opt.password) {
                chrome.webRequest.onAuthRequired.addListener((details) => {
                        console.log(details);
                        if (details.isProxy === true) {
                            let credentials = {
                                'username': opt.username,
                                'password': opt.password
                            }
                            console.log('setting credentials');
                            return {
                                authCredentials: credentials
                            }
                        }
                    }, {
                        urls: ["<all_urls>"]
                    },
                    ['blocking']
                );
                chrome.webRequest.onCompleted.addListener(
                    (details) => {
                        console.log(details);
                        console.log('completed credentials')
                        if (sendResponse)
                            sendResponse('messgae received');
                        res(true)
                    }, {
                        urls: ["<all_urls>"]
                    }
                );
            } else res(false)
        })

    }

    await chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        console.log(message.data)
        set_credentials(message.data, sender)
        sendResponse('messgae received');
    });
}