document.addEventListener('DOMContentLoaded', function () {
	const zoneWrapper = document.getElementById('zone');
	const timeWrapper = document.getElementById('time');
	const errorsWrapper = document.getElementById('errors');
	const hitsWrapper = document.getElementById('hits');
	const clueWrapper = document.getElementById('clue');

	const gameEndTimeWrapper = document.getElementById('game-end-time');
	const gameEndErrorsWrapper = document.getElementById('game-end-errors');
	const gameEndHitsWrapper = document.getElementById('game-end-hits');
	const gameEndPercentWrapper = document.getElementById('game-end-percent');

	const zoneSelect = document.getElementById('zone-select');
	const typeSelect = document.getElementById('type-select');

	const countryCapitalIndicator = document.getElementById(
		'country-capital-indicator'
	);
	const countryCapitalName = document.getElementById('country-capital-name');
	const countryCapitalValue = document.getElementById(
		'country-capital-value'
	);

	const gameForm = document.getElementById('game-form');

	const gameEndModal = bootstrap.Modal.getOrCreateInstance(
		document.getElementById('gameEndModal')
	);

	const resetGameButtons =
		document.getElementsByClassName('reset-game-button');

	// Settings Events
	zoneSelect.addEventListener('change', resetGame);
	typeSelect.addEventListener('change', resetGame);

	for (let i = 0; i < resetGameButtons.length; i++) {
		resetGameButtons.item(i).addEventListener('click', resetGame);
	}

	// Game logic
	let zones = [];
	let currentZone = null;

	let startTime = Date.now();
	let errors = 0;
	let hits = 0;

	let clueWords = 0;

	gameForm.addEventListener('submit', function (event) {
		event.preventDefault();

		const value = countryCapitalValue.value.trim().toLowerCase();
		const correctValue =
			typeSelect.value === 'parent'
				? currentZone.parent.toLowerCase()
				: currentZone.child.toLowerCase();

		if (value === correctValue) {
			hits++;
			clueWords = 0;

			gameForm.reset();
			setRandomZone();
			countryCapitalValue.classList.remove('is-invalid');
		} else {
			errors++;
			clueWords++;

			countryCapitalValue.classList.add('is-invalid');
		}
		updateWrappers();

		if (zones.length === 0 && !currentZone) {
			endGame();
			return;
		}
	});

	async function resetGame() {
		await fetchZoneData();
		setRandomZone();
		resetValues();
		updateWrappers();
	}

	function resetValues() {
		startTime = Date.now();
		errors = 0;
		hits = 0;
	}

	function clue(word) {
		if (clueWords > 2 || word.length < 4) {
			return word;
		}

		let clue = '';

		clue += word.slice(0, clueWords);
		clue += '*'.repeat(word.length - clueWords * 2);
		clue += word.slice(word.length - clueWords);

		return clue;
	}

	function updateWrappers() {
		zoneWrapper.innerHTML =
			zoneSelect.options[zoneSelect.options.selectedIndex].text;
		updateTime();
		errorsWrapper.innerHTML = errors;
		hitsWrapper.innerHTML = hits;

		if (currentZone) {
			if (typeSelect.value === 'parent') {
				countryCapitalName.innerHTML = currentZone.child;
				clueWrapper.innerHTML = clue(currentZone.parent);
			} else if (typeSelect.value === 'child') {
				countryCapitalName.innerHTML = currentZone.parent;
				clueWrapper.innerHTML = clue(currentZone.child);
			}
		}

		if (typeSelect.value === 'parent') {
			countryCapitalIndicator.innerHTML = 'Capital';
			countryCapitalValue.placeholder = 'Ingrese el pais/estado';
		} else if (typeSelect.value === 'child') {
			countryCapitalIndicator.innerHTML = 'Pais/Estado';
			countryCapitalValue.placeholder = 'Ingrese la capital';
		}
	}

	function updateTime() {
		const deltaSeconds = Math.floor((Date.now() - startTime) / 1000);

		hours = Math.floor(deltaSeconds / 3600);
		minutes = Math.floor((deltaSeconds % 3600) / 60);
		seconds = deltaSeconds % 60;

		timeWrapper.innerHTML = `${hours < 10 ? '0' + hours : hours}:${
			minutes < 10 ? '0' + minutes : minutes
		}:${seconds < 10 ? '0' + seconds : seconds}`;
	}
	setInterval(() => {
		updateTime();
	}, 100);

	async function fetchZoneData() {
		const zonesResponse = await fetch(
			`./assets/zones/${zoneSelect.value}.json`
		);

		if (zonesResponse.status !== 200) {
			alert('Error loading zone data');
			return;
		}

		const zoneData = await zonesResponse.json();
		zones = zoneData.zones;
	}

	function setRandomZone() {
		if (zones.length === 0) {
			currentZone = null;
			return;
		}

		currentZone = zones.splice(
			Math.floor(Math.random() * zones.length),
			1
		)[0];
	}

	function endGame() {
		gameEndTimeWrapper.innerHTML = timeWrapper.innerHTML;
		gameEndErrorsWrapper.innerHTML = errors;
		gameEndHitsWrapper.innerHTML = hits;
		gameEndPercentWrapper.innerHTML =
			Math.round((hits / (hits + errors)) * 100) + '%';

		gameEndModal.show();
	}

	async function setZones() {
		zonesSettingsResponse = await fetch('./assets/zones/settings.json');

		if (zonesSettingsResponse.status !== 200) {
			alert('Error loading zones settings');
			return;
		}

		zonesSettings = await zonesSettingsResponse.json();

		zoneSelect.innerHTML = zonesSettings.zones
			.map(zone => {
				return `<option value="${zone.code}" ${
					zonesSettings.default == zone.id ? 'default' : ''
				}>${zone.name}</option>`;
			})
			.join('');

		resetGame();
	}
	setZones();
});
