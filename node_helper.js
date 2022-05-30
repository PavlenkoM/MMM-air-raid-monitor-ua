/* Magic Mirror
 * Node Helper: MMM-air-raid-monitor-ua
 *
 * By PavlenkoM
 */

const NodeHelper = require("node_helper");
const https = require("https");

const AIR_RAID_API = "https://sirens.in.ua/api/v1/";

module.exports = NodeHelper.create({
	start: function() {
		this.expressApp.get("/airRaid", this.loadAirRaidData.bind(this));
	},

	loadAirRaidData: async function(req, res) {
		try {
			const airRaidData = await this.fetchRemoteData(AIR_RAID_API);
			res.send(airRaidData);
		} catch (e) {
			console.error(e);
			res.send(e);
		}
	},

	fetchRemoteData: function (url) {
		return new Promise((resolve, reject) => {
			https.get(url, (res) => {
				const { statusCode } = res;
				const contentType = res.headers['content-type'];

				let error;
				if (statusCode !== 200) {
					error = new Error('Request Failed.\n' +
									`Status Code: ${statusCode}`);
				} else if (!/^application\/json/.test(contentType || '')) {
					error = new Error('Invalid content-type.\n' +
									`Expected application/json but received ${contentType}`);
				}
				if (error) {
					console.error(error.message);
					res.resume();
					return reject(error);
				}

				res.setEncoding('utf8');
				let rawData = '';
				res.on('data', (chunk) => { rawData += chunk; });
				res.on('end', () => {
					try {
						const parsedData = JSON.parse(rawData);
						return resolve(parsedData);
					} catch (e) {
						console.error(e.message);
						return reject(e);
					}
				});
			}).on('error', (e) => {
				console.error(`Got error: ${e.message}`);
				return reject(e);
			});
		});
	}
});
