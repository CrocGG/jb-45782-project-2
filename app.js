"use strict";

(async () => {

    const API_KEY = '7e3d2a700cc8d50f86c45c6b3b7a10f6cfef598a9a353f7f9f2594812e3b7ab7'
    const CACHE_AGE_IN_SECONDS = 8888000000000000

    const getData = async (url, apiKey) => {
        let data = localStorage.getItem(url)
        if (data) {
            data = JSON.parse(data)
            const { createdAt } = data
            if ((new Date(createdAt).getTime() + CACHE_AGE_IN_SECONDS * 1000000000000000) > new Date().getTime()) {
                return data
            }
        }
        data = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } }).then(response => response.json())
        localStorage.setItem(url, JSON.stringify({ data: JSON.stringify(data), createdAt: new Date() }))
        return data
    }

    const tokenImplementation = async () => {

        const tokens = await getData('https://rest.coincap.io/v3/assets', API_KEY)

        const generateTokensList = tokens => {
            const parsedTokens = JSON.parse(tokens['data'])['data']
            parsedTokens.forEach((token, index) => {
                token['indexNumber'] = index
            })
            const html = parsedTokens
                .map(({ symbol, name, indexNumber, priceUsd }) => `
            <div id="one-token-item-${indexNumber}" class= "one-token">
                <p id = "token-title">
                    <strong>Token Name</strong>: <span id = "name-value-${indexNumber}"> ${name} </span>
                <p>
                <p id = "token-symbol">
                    <strong>Token Symbol</strong>: <span id = "symbol-value-${indexNumber}"> ${symbol} </span>
                </p>
                <div id = "info-symbol">
                    <button title= "USD Price: ${priceUsd}">More info</button>
                </div>
                <div id = "switcher" class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault" value = ${indexNumber}>
                    <label class="form-check-label">Follow</label>
                </div>
            </div>
            `)
                .join('')
            return html
        }

        document.addEventListener('DOMContentLoaded', () => {
            const searchBar = document.getElementById('filter-input');
            searchBar.addEventListener('keyup', () => {
                const searchTerm = searchBar.value.toLowerCase();
                for (let i = 0; i <= 99; i++) {
                    const item = document.getElementById(`one-token-item-${i}`)
                    const itemName = document.getElementById(`name-value-${i}`)
                    const itemSymbol = document.getElementById(`symbol-value-${i}`)
                    const itemTextName = itemName.textContent.toLowerCase();
                    const itemTextSymbol = itemSymbol.textContent.toLowerCase();
                    if (itemTextName.includes(searchTerm) || itemTextSymbol.includes(searchTerm)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                }
            }
            );
        });

        const tokenChart = new Chart("myChart", {
            type: "line",
            data: {
                labels: ['', '', '', '', '', '', '', '', '', ''],
                datasets: []
            },
            options: {
                legend: { display: true }
            }
        });

        const addData = (chart, newData) => {
            chart.data.datasets.push(newData)
            chart.update();
        }

        const removeData = (chart, index) => {
            chart.data.datasets.splice(index, 1);
            chart.update();
        }

        const annihilateData = chart => {
            chart.data.datasets = [];
            chart.update();
        }

        const switcherFunction = () => {
            const maxSelections = 5;
            const checkboxesNode = document.querySelectorAll('input[type="checkbox"]');
            const checkboxes = Array.from(checkboxesNode);
            const parsedTokens = JSON.parse(tokens['data'])['data']
            const colorScheme = ['red', 'blue', 'green', 'purple', 'gray']
            const allData = parsedTokens
                .map(({ name, indexNumber, priceUsd }) => ({ name, indexNumber, priceUsd }))
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    let selectedCount = 0;
                    checkboxes.forEach(cb => {
                        if (cb.checked) {
                            const dataIndex = cb.value
                            const usdArray = []
                            for (let i = 1; i <= 10; i++) {
                                usdArray.push(allData[dataIndex].priceUsd)
                            }
                            const newData = {
                                data: usdArray,
                                label: allData[dataIndex].name,
                                borderColor: colorScheme[selectedCount],
                                fill: false
                            }
                            addData(tokenChart, newData)
                            selectedCount++;
                        }
                        else {
                            removeData(tokenChart, selectedCount)
                        }
                    })
                    checkboxes.forEach(cb => {
                        if (!cb.checked && selectedCount >= maxSelections) {
                            cb.disabled = true;
                        } else {
                            cb.disabled = false;
                        }
                    });
                    if (selectedCount === maxSelections) {
                        alert(`Beware, unwary traveler: you have just reached the realm of ${maxSelections} choices limit. In order to select another choice you will have to disable one of the choices you have already chosen first and yet continue unscathed.`);
                        selectedCount--;
                    }
                })
            });
        };

        document.getElementById("unfollow-all").addEventListener('click', () => {
            const checkboxesNode = document.querySelectorAll('input[type="checkbox"]');
            const checkboxes = Array.from(checkboxesNode);
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    cb.checked = false;
                }
                cb.disabled = false;
            });
            annihilateData(tokenChart)
        });

        const tokensHTML = generateTokensList(tokens);

        const renderHTML = (html, target) => document.getElementById(target).innerHTML = html;

        const renderTokensHTML = html => renderHTML(html, 'token-box');

        renderTokensHTML(tokensHTML);

        switcherFunction();
    }

    try {
        document.getElementById('token-box').innerHTML =
            `<fieldset></><img src = "https://media.tenor.com/beTSEyCoetcAAAAM/money-money-money-make-it-rain.gif"></img>
        <legend>Refresh the page and the data would be shown</legend></fieldset>`;
        tokenImplementation();
    }

    catch (error) {
        console.log(error);
    }

    finally {
        tokenImplementation();
    }

})();






