const MODULE_NAME = 'MMM-air-raid-monitor-ua';
const TIMER_INTERVAL = 30000; // 30 seconds

Module.register(MODULE_NAME, {
	requiresVersion: "2.19.0",

	defaults: {
		updateInterval: TIMER_INTERVAL
	},

	isLoading: false,
	airRaidData: null,
	requestTimer: null,
	mapSVG: null,

	getStyles: function() {
		return [
			this.file(`${MODULE_NAME}.css`)
		];
	},

	start: function() {
		this.loadAirRaidData();
		// this.initLoaderTimer();
	},

	stop: function() {
		this.clearLoaderTimer();
	},

	getDom: async function() {
		var wrapper = document.createElement("div");
		wrapper.className = `${MODULE_NAME}-wrapper`;
		if (this.isLoading) {
			wrapper.innerHTML = this.loadingTemplate();
		} else {
			wrapper.innerHTML = await this.mapTemplate();
		}
		return wrapper;
	},

	getMapSVG: async function() {
		if (this.mapSVG) {
			return this.mapSVG;
		}

		try {
			const responseData = await fetch(`/${MODULE_NAME}/ua.svg`);
			this.mapSVG = await responseData.text();
		} catch (e) {
			console.error(e);
		}

		return this.mapSVG;
	},

	loadAirRaidData: async function() {
		this.isLoading = true;
		this.updateDom();

		try {
			const responseData = await fetch('/airRaid');
			this.airRaidData = await responseData.json();
		} catch(e) {
			console.error(e);
		}

		this.isLoading = false;
		this.updateDom();
	},

	initLoaderTimer: function() {
		this.clearTimer();

		this.requestTimer = setTimeout(() => {
			this.loadAirRaidData();
			this.initLoaderTimer();
		}, this.config.updateInterval);
	},

	clearTimer: function() {
		if (this.requestTimer) {
			clearTimeout(this.requestTimer);
			this.requestTimer = null;
		}
	},

	loadingTemplate: function () {
		return 'Loading...';
	},

	mapTemplate: async function () {
		return `
			${this.getMapStyles()}
			${await this.getMapSVG()}
		`;
	},

	getMapStyles: function () {
		const statuses = {
			no_data: {
				selectors: [],
				styles: `{
					fill: rgba(255,255,255,0.25);
					stroke: red;
				}`
			},
			partial: {
				selectors: [],
				styles: `{
					fill: rgba(255,255,255,0.5);
				}`
			},
			full: {
				selectors: [],
				styles: `{
					fill: rgba(255,255,255,0.9);
				}`
			}
		};

		Object.keys(this.airRaidData).map(region => {
			const status = this.airRaidData[region];
			if (!status) {
				return;
			}

			statuses[status].selectors.push(`[name="${region}"]`);
		});

		const stylesList = Object.keys(statuses).map(status => {
			const {selectors, styles} = statuses[status];
			if (!selectors?.length) {
				return '';
			}

			return `${selectors.join(',')} ${styles}`;
		});



		return `<style>${stylesList.join(' ')}</style>`;
	}
});
