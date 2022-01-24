// window.onload = async () => {
console.log('content');
const set_credentials = async (opt = {
    username,
    password
}, sender, sendResponse) => {
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
                if (sendResponse)
                    sendResponse('messgae received');
            }, {
                urls: ["<all_urls>"]
            }
        );
    }
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log(message.data)
    await set_credentials(message.data, sender)
    sendResponse('messgae received');

});
// }