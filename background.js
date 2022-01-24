window.onload = async () => {

    const set_credentials = async (opt = {
        username,
        password
    }, sender) => {
        console.log(sender.url);
        if (opt.username && opt.password) {
            await chrome.webRequest.onAuthRequired.addListener((details) => {
                    console.log("onAuthRequired!", details);
                    let credentials = {
                        username: opt.username,
                        password: opt.password
                    }
                    console.log('setting credentials');
                    return {
                        authCredentials: credentials
                    }

                }, {
                    urls: ["<all_urls>"]
                },
                ['blocking']
            );
            chrome.webRequest.onCompleted.addListener(
                () => {
                    console.log('completed credentials')
                }, {
                    urls: ["<all_urls>"]
                }
            );
        }
    }

    await chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        console.log(message.data)
        await set_credentials(message.data, sender)
        sendResponse('messgae received');
    });
}