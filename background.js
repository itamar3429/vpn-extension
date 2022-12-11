(async () => {
	chrome.runtime.onMessage.addListener(
		async (message, sender, sendResponse) => {
			console.log(message.data);
			set_credentials(message.data, sender);
			sendResponse("message received");
		}
	);
	// do something here
})();

const onAuthIntercept = (details, data, asyncCb) => {
	console.log("details", details);
	console.log("opt", data);
	console.log("async cb: ", asyncCb);
	if (
		details.isProxy === true &&
		details.challenger?.host == data.ip &&
		details.challenger?.port == data.port
	) {
		console.log("intercepting credentials!!!");
		let credentials = {
			username: data.username,
			password: data.password,
		};
		console.log("credentials", credentials);
		const res = {
			authCredentials: credentials,
			...credentials,
		};
		asyncCb?.(res);
		return res;
	}
};

const set_credentials = async (
	data = {
		username,
		password,
		host,
		port,
	},
	sender
) => {
	await new Promise(async (res) => {
		console.log(sender.url);
		if (data.username && data.password) {
			// add auth requirement listener
			console.log(chrome.declarativeNetRequest);
			chrome.webRequest.onAuthRequired.addListener(
				(details, asyncCb) => onAuthIntercept(details, data, asyncCb),
				{
					urls: ["<all_urls>"],
				}
				// ["asyncBlocking"]
			);

			chrome.webRequest.onCompleted.addListener(
				(details) => {
					console.log("completed credentials");
					res(true);
				},
				{
					urls: ["<all_urls>"],
				}
			);
		} else res(false);
	});
};
