
window.onload = async () => {
    document.querySelector('#btnSetProxy').addEventListener('click', (e) => {
        let ip = document.querySelector('#ip').value
        let port = document.querySelector('#port').value
        let username = document.querySelector('#username').value
        let password = document.querySelector('#password').value
        await setProxy({ ip, port, username, password })
        alert(`ip is : ${ip}, \n port is: ${port}, \n username is : ${username}, \n password is: ${password}`)
        console.log(`ip is : ${ip}, \n port is: ${port}, \n username is : ${username}, \n password is: ${password}`);
    })
}

const setProxy = async (opt = { ip, port, username, password }) => {

    var config = {
        mode: "fixed_servers",
        rules: {
            proxyForHttp: {
                scheme: "https",
                host: opt.ip,
                port: opt.port,

            },
            proxyRules: {
                singleProxy: "*amazon.com*"
            },
            bypassList: ["google.com", "ebay.com", "getproduct.io", "<local>"]
        }
    };
    chrome.proxy.settings.set(
        { value: config, scope: 'regular' },
        function () { }
    );

}
