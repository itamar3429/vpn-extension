const proxyArrKey = "proxy_list";
const defProtocol = "http";
let savedSelect = document?.getElementById("savedSelect");
let ip = document?.querySelector("#ip");
let port = document?.querySelector("#port");
let username = document?.querySelector("#username");
let password = document?.querySelector("#password");
let protocol = document?.querySelector("#protocol");
let currentProxy = document.getElementById("currentProxy");
let singleProxy = document.querySelector("#single");

const protocols = ["http", "https", "socks5", "socks4"];

/**
 * @typedef {{ ip:string; port:string | number; username:string; password:string; protocol:"http"|"https"|"socks5"|"socks4"; last:boolean;}} ProxyItem
 */

/**
 *
 * @param {string} key
 * @returns
 */
const getStorage = (key, onNull = []) => {
	let res = new Promise((res) => {
		chrome.storage.sync.get(key, (result) => {
			res(result[key] || onNull);
		});
	});
	return res;
};
/**
 * @returns {Promise<ProxyItem[]>}
 */
async function getArrFromStorage() {
	const res = await getStorage(proxyArrKey);
	return res;
}

const setStorage = (key, val) => {
	chrome.storage.sync.set({
		[key]: val,
	});
};

function getProxyConfig() {
	const res = new Promise((res) => {
		chrome.proxy.settings.get(
			{
				incognito: false,
			},
			function (config) {
				res(config);
			}
		);
	});
	return res;
}

function setProxyConfig(config, scope = "regular") {
	const res = new Promise((res) => {
		chrome.proxy.settings.set({ value: config, scope }, function () {
			res();
		});
	});
	return res;
}

let alertQ = 0;
const setAlert = (text) => {
	alertQ++;
	let alertQT = alertQ;
	document.getElementById("alert").innerText = text;
	document.getElementById("alert").classList.add("showalert");
	document.getElementById("alert").classList.add("alertop");
	setTimeout(() => {
		if (alertQ == alertQT) {
			document.getElementById("alert").classList.remove("alertop");
		}
	}, 7000);
	setTimeout(() => {
		if (alertQ == alertQT) {
			document.getElementById("alert").classList.remove("showalert");
		}
	}, 9000);
};

/**
 *
 * @template {keyof HTMLElementTagNameMap} T
 * @param {T} tag
 * @param {Record<keyof HTMLElementTagNameMap[T],any>} attributes
 */
function createElement(tag, attributes) {
	const el = document.createElement(tag);
	Object.entries(attributes).map(([key, val]) => {
		el[key] = val;
	});
	return el;
}

async function load() {
	const result = await getArrFromStorage();

	savedSelect.innerHTML = "";

	if (result.length) {
		// load saved select options
		savedSelect.appendChild(
			createElement("option", {
				value: "",
				id: "option",
				selected: true,
				innerText: "select proxy",
			})
		);
		result.forEach((item, i) => {
			savedSelect.appendChild(
				createElement("option", {
					value: i,
					id: "ip-option",
					selected: !!item.last,
					innerText: `${item.protocol}://${item.ip}:${item.port}`,
				})
			);
		});

		let selected = result.find((x) => x.last === true) || result[0];

		ip.value = selected?.ip || "";
		port.value = selected?.port || "";
		username.value = selected?.username || "";
		password.value = selected?.password || "";
		protocol.value = selected?.protocol || defProtocol;
	} else {
		savedSelect.appendChild(
			createElement("option", {
				value: "",
				id: "options",
				innerText: "no proxy saved",
			})
		);
	}

	const config = await getProxyConfig();

	if (config?.value?.rules?.singleProxy) {
		let proxy = config.value.rules.singleProxy;
		currentProxy.innerText = `proxy is listening on:\n  ${proxy.scheme}://${proxy.host}:${proxy.port}`;
	} else {
		currentProxy.innerText = `proxy is not active`;
	}
}

async function clearProxy() {
	await setProxyConfig({
		mode: "direct",
	});
}

/**
 *
 * @param {ProxyItem & {singleProxy:any}} opt
 */
const setProxy = async (opt) => {
	try {
		if (opt.username && opt.password) {
			chrome.runtime.sendMessage(
				{
					data: opt,
				},
				function (response) {
					if (response) setAlert(response);
				}
			);
		}
		var config = null;
		if (opt.ip && opt.port) {
			await clearProxy();
			config = {
				mode: "fixed_servers",
				rules: {
					singleProxy: {
						scheme: opt.protocol || defProtocol,
						host: opt.ip,
						port: opt.port ? parseInt(opt.port) : null,
					},
				},
			};
			await setProxyConfig(config);
			setAlert(`proxy set to: ${opt.ip}:${opt.port}`);
			resolve(true);
		} else {
			setAlert(`please select ip and port`);
			resolve(false);
		}
	} catch (error) {
		setAlert(`error while setting proxy: ${error.message}`);
	}
};

window.onload = async () => {
	//  init all parameters
	savedSelect = document?.getElementById("savedSelect");
	ip = document?.querySelector("#ip");
	port = document?.querySelector("#port");
	username = document?.querySelector("#username");
	password = document?.querySelector("#password");
	protocol = document?.querySelector("#protocol");
	currentProxy = document.getElementById("currentProxy");
	singleProxy = document.querySelector("#single");
	const clearProxyBtn = document.querySelector("#btnClearProxy");
	const setProxyBtn = document.querySelector("#btnSetProxy");
	const deleteProxyBtn = document.querySelector("#btnDeleteProxy");

	// load content
	load();

	// on saved select change
	savedSelect.addEventListener("change", async (e) => {
		if (e.target.value) {
			let proxyIndex = +e.target.value;
			const proxy = (await getArrFromStorage())?.find(
				(_, i) => i == proxyIndex
			);
			ip.value = proxy.ip;
			port.value = proxy.port;
			username.value = proxy.username;
			password.value = proxy.password;
			protocol.value = proxy.protocol;
			setAlert(
				`proxy changed, for the change to take affect please press set`
			);
		} else {
			setAlert(`select proxy`);
			ip.value = "";
			port.value = "";
			username.value = "";
			password.value = "";
			protocol.value = defProtocol;
		}
	});

	// on set proxy button click
	setProxyBtn.addEventListener("click", async (e) => {
		let proxies = await getArrFromStorage();
		const proxy = {
			ip: ip.value,
			port: port.value,
			username: username.value,
			password: password.value,
			protocol: protocol.value,
			last: true,
		};

		if (proxy.ip && proxy.port) {
			// if proxy already saved
			if (
				proxies.length &&
				!proxies.find(
					(x) =>
						x.ip == proxy.ip &&
						x.port == proxy.port &&
						x.username == proxy.username &&
						x.password == proxy.password &&
						x.protocol == proxy.protocol
				)
			) {
				//see if i need to insert new value
				proxies.forEach((x) => (x.last = false));
				proxies.push(proxy);
				// if proxy not saved
			} else if (proxies.length) {
				proxies.forEach((x) => {
					if (
						x.ip == proxy.ip &&
						x.port == proxy.port &&
						x.username == proxy.username &&
						x.password == proxy.password &&
						x.protocol == proxy.protocol
					)
						x.last = true;
					else x.last = false;
				});
				// proxy array is empty just add the proxy
			} else {
				proxies = [proxy];
			}
		}

		setStorage(proxyArrKey, proxies);

		await setProxy({
			...proxy,
			singleProxy: singleProxy.value,
		});
		await load();

		console.log(
			`ip is : ${ip.value}, \n port is: ${port.value}, \n username is : ${username.value}, \n password is: ${password.value}, \n protocol is: ${protocol.value}`
		);
	});

	// on clear proxy button click
	clearProxyBtn.addEventListener("click", async (e) => {
		// remove current proxy config (no active proxy)
		await clearProxy();

		// reload content
		await load();

		ip.value = "";
		port.value = "";
		username.value = "";
		password.value = "";
		protocol.value = defProtocol;

		savedSelect.value = "";
		setAlert(`proxy cleared`);
	});

	// on delete proxy button click
	deleteProxyBtn.addEventListener("click", async (e) => {
		try {
			let val = await getArrFromStorage();
			if (val?.length) {
				val = val.filter(
					(x) =>
						!(
							x.ip == ip.value &&
							x.port == port.value &&
							x.username == username.value &&
							x.password == password.value &&
							x.protocol == protocol.value
						)
				);
			}
			setStorage(proxyArrKey, val);
			await load();
			ip.value = "";
			port.value = "";
			username.value = "";
			password.value = "";
			protocol.value = defProtocol;

			setProxy();
			await clearProxy();

			setAlert(`proxy deleted to deactivate current proxy press clear`);
		} catch (error) {
			setAlert(`error while deleting: ${error.message}`);
		}
	});
};
