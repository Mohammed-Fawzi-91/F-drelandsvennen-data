/**
 * jeg brukte url og proxy url til å vise min forstårelse på APIer,
 *  men samtidig henter jeg data fra lokal .json hvis function  ikke klarer å fetch()
 * 
 * 
 */

const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const url = 'https://ommu1982.pythonanywhere.com/sttic/boligprisstatistikk.json';
// Function til å  fetch data
const fetchData = async () => {
    try {
        const response = await fetch(proxyUrl + url);
        if (!response.ok) {
            const message = document.getElementById('wrong-msg');
            message.innerHTML = '<h2>**vi bruker lokalt data**</h2>';
            throw new Error('Nettverksfeil: ' + response.status);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Det er en feil ved henting av data:', error);
        
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                const message = document.getElementById('wrong-msg');
            message.innerHTML = '<h2> Det er en feil ved henting av data fra APIer, og det finnes ingen lokal data</h2>';
                throw new Error('Kunne ikke hente lokal data: ' + response.status);
            }
            const data = await response.json();
            return data;
        } catch (localError) {
            console.error('Det er en feil ved henting av lokal data:', localError);
            return null;
        }
    }
};


// Function for å rette By navn 
const cleanCityName = city => city.replace(/\d+|\s+(m\/omegn|m\/omegnafter|after)/gi, '').trim();

// lage knapp for hver by 
const createCityButtons = data => {
    const buttonsContainer = document.getElementById('city-buttons');
    buttonsContainer.innerHTML = ''; // Clear existing buttons
    for (const city in data) {
        if (data.hasOwnProperty(city)) {
            const button = document.createElement('button');
            button.className = 'city-button';
            button.textContent = cleanCityName(city);
            button.addEventListener('click', () => toggleCityTable(city, data, button));
            buttonsContainer.appendChild(button);

            // lage container til tabellen 
            const cityTableContainer = document.createElement('div');
            cityTableContainer.className = 'city-table';
            cityTableContainer.id = `table-${city}`;
            buttonsContainer.appendChild(cityTableContainer);
        }
    }
};

// Function til å vise dataen 
const showData = (city, data, tableContainer) => {
    const cityData = data[city];
    const tableBody = tableContainer.getElementsByClassName('data-body')[0];
    tableBody.innerHTML = '';

    for (let key in cityData) {
        if (cityData.hasOwnProperty(key)) {
            const row = document.createElement('tr');
            let value = cityData[key];
            
            const keyCell = document.createElement('td');
            keyCell.textContent = key;
            row.appendChild(keyCell);

            const valueCell = document.createElement('td');
// noen data her mangler Kr, andre er string og må byttes til nummber, og på slutten adder jeg % til taller
            if (key === 'Gjennomsnitt kvm. pris' || key === 'Gjennomsnittspris') {
                valueCell.textContent = value + ' Kr';
            } else if (typeof value === 'number' || typeof value === 'string') {
                if (key === 'Endring hittil i år' && typeof value === 'string') {
                    value = parseFloat(value.replace('%', '')); 
                }
                valueCell.textContent = `${value} % `;
// grønn og rødt peal 
                const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svgIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                svgIcon.setAttribute('viewBox', '0 0 320 512');
                svgIcon.setAttribute('width', '12');
                svgIcon.setAttribute('height', '12');

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute('fill', 'currentColor');

                if (value > 0) {
                    svgIcon.setAttribute('class', 'green-icon');
                    path.setAttribute('d', 'M182.6 137.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8H288c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-128-128z');
                } else if (value < 0) {
                    svgIcon.setAttribute('class', 'red-icon');
                    path.setAttribute('d', 'M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z');
                } else {
                    svgIcon.setAttribute('class', 'gray-icon');
                    path.setAttribute('d', 'M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z');
                }

                svgIcon.appendChild(path);
                valueCell.appendChild(svgIcon);
            } else {
                valueCell.textContent = value;
            }

            row.appendChild(valueCell);
            tableBody.appendChild(row);
        }
    }
};

// Function til å lage bar 
const createBarChart = (city, data, chartContainer) => {
    let cityData = data[city];
    if (cityData['Endring hittil i år'] && typeof cityData['Endring hittil i år'] === 'string' ) {
        cityData['Endring hittil i år'] = parseFloat(cityData['Endring hittil i år'].replace('%', ''));
    }
            
    
    chartContainer.innerHTML = ''; 

    const maxValue = Math.max(...Object.values(cityData).map(v => typeof v === 'number' ? v : 0));

    for (const key in cityData) {
        if (cityData.hasOwnProperty(key)) {
            const value = cityData[key];

            if (typeof value === 'number') {
                const barWrapper = document.createElement('div');
                barWrapper.className = 'bar-wrapper';

                const bar = document.createElement('div');
                bar.className = 'bar';
                bar.style.height = (value / maxValue * 100) + 'px'; // Scale bar height

                const label = document.createElement('div');
                label.className = 'bar-label';
                label.textContent = key;

                barWrapper.appendChild(bar);
                barWrapper.appendChild(label);
                chartContainer.appendChild(barWrapper);
            }
        }
    }
};

// Function til å  toggle by tabell 
const toggleCityTable = (city, data, button) => {
    const cityTableContainer = document.getElementById(`table-${city}`);
    
    if (!cityTableContainer.querySelector('table')) {
        const table = document.createElement('table');
    
        const tbody = document.createElement('tbody');
        tbody.className = 'data-body';
        table.appendChild(tbody);

        cityTableContainer.appendChild(table);

        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        cityTableContainer.appendChild(chartContainer);
    }

    if (cityTableContainer.style.display === 'none' || cityTableContainer.style.display === '') {
        showData(city, data, cityTableContainer);
        createBarChart(city, data, cityTableContainer.querySelector('.chart-container'));
        cityTableContainer.style.display = 'block';
    } else {
        cityTableContainer.style.display = 'none';
    }
};

// Fetch data og lage knapper "on page load"
window.onload = async () => {
    const data = await fetchData();
    if (data) {
        createCityButtons(data);
    } else {
        console.error('Kunne ikke hente data. Vennligst prøv igjen senere.');
    }
};
