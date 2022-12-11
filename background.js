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
	if (
		details.isProxy === true &&
		details.challenger?.host == data.ip &&
		+details.challenger?.port == +data.port
	) {
		let credentials = {
			username: data.username,
			password: data.password,
		};
		const res = {
			authCredentials: credentials,
		};

		console.log("intercepting credentials!!!");

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
		if (data.username && data.password) {
			// add auth requirement listener
			chrome.webRequest.onAuthRequired.addListener(
				(details, asyncCb) => onAuthIntercept(details, data, asyncCb),
				{
					urls: ["<all_urls>"],
				},
				["asyncBlocking"]
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
