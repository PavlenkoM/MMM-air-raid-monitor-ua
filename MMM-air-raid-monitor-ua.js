const AIR_RAID_MODULE_NAME = 'MMM-air-raid-monitor-ua';

Module.register(AIR_RAID_MODULE_NAME, {
	requiresVersion: "2.19.0",

	defaultUpdateInterval: 10,  // 10 seconds
	styleSelectorPrefix: 'air-raid-status',
	status: {
		no_data: 'no_data',
		partial: 'partial',
		full: 'full'
	},

	defaults: {
		updateInterval: this.defaultUpdateInterval
	},

	isLoading: false,
	airRaidData: {},
	requestTimer: null,
	mapSVG: null,

	getStyles: function() {
		return [
			this.file(`${AIR_RAID_MODULE_NAME}.css`)
		];
	},

	start: function() {
		this.loadAirRaidData();
		this.initLoaderTimer();
	},

	stop: function() {
		this.clearLoaderTimer();
	},

	getDom: async function() {
		const wrapper = document.createElement("div");
		wrapper.className = `${AIR_RAID_MODULE_NAME}-wrapper`;

		let content = await this.mapTemplate();
		if (this.isLoading) {
			content += this.getPreloaderLoader();
		}
		wrapper.innerHTML = content;

		return wrapper;
	},

	getUpdateTimerInterval: function() {
		return (this.config.updateInterval < this.defaultUpdateInterval ? this.defaultUpdateInterval : this.config.updateInterval) * 1000;
	},

	getMapSVG: async function() {
		if (this.mapSVG) {
			return this.mapSVG;
		}

		try {
			const responseData = await fetch(`/${AIR_RAID_MODULE_NAME}/ua.svg`);
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
		}, this.getUpdateTimerInterval());
	},

	clearTimer: function() {
		if (this.requestTimer) {
			clearTimeout(this.requestTimer);
			this.requestTimer = null;
		}
	},

	mapTemplate: async function () {
		return `
			${this.getMapStyles()}
			${await this.getMapSVG()}
			${this.getMapLegend()}
		`;
	},

	getMapStyles: function () {
		const statuses = {
			[this.status.no_data]: {
				selectors: [`.${this.styleSelectorPrefix}-${this.status.no_data}`],
				styles: `{
					fill: rgba(255,255,255,0.25);
					background-color: rgba(255,255,255,0.25);
					border: 1px solid red;
					stroke: red;
				}`
			},
			[this.status.partial]: {
				selectors: [`.${this.styleSelectorPrefix}-${this.status.partial}`],
				styles: `{
					background-color: rgba(255,255,255,0.5);
					border: 1px solid #ffffff;
					fill: rgba(255,255,255,0.5);
					stroke: #000000;
				}`
			},
			[this.status.full]: {
				selectors: [`.${this.styleSelectorPrefix}-${this.status.full}`],
				styles: `{
					background-color: rgba(255,255,255,0.9);
					border: 1px solid #ffffff;
					fill: rgba(255,255,255,1);
					stroke: #000000;
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
	},

	getMapLegend: function () {
		const itemsList = Object.keys(this.status).map(key => {
			const status = this.status[key];
			return `
				<li class="graph-legend-item">
					<span class="air-raid-status-${status}"></span> ${this.translate(status)}
				</li>
			`;
		});
		return `<ul class="graph-legend">${itemsList.join('')}</ul>`;
	},

	getPreloaderLoader: function () {
		return `
			<div class="preloader">
				<div class="preloader__spinner"></div>
			</div>
		`;
	},

	getTranslations: function() {
		return {
				en: "translations/en.json",
				uk: "translations/uk.json"
		}
	}
});
