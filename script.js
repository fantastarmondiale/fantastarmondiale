document.addEventListener('DOMContentLoaded', function() {
    // Seleziona primo Tab
    document.querySelector('.tablink').click();
});

// Funzione per ottenere un timestamp univoco
function getUniqueParam() {
    return `?_=${new Date().getTime()}`;
}

// Carica Listone
function loadListone(){
    fetch('nazionali.json')
        .then(response => response.json())
        .then(data => {
            let table = document.getElementById('listoneTable').getElementsByTagName('tbody')[0];
            data.forEach(nazionale => {
                let row = table.insertRow();
                let cellBandiera = row.insertCell(0);
                let cellNazionale = row.insertCell(1);
                let cellValore = row.insertCell(2);

                cellBandiera.innerHTML = `<img class="flag" src="${nazionale.flag}" alt="${nazionale.name}">`;
                cellBandiera.classList.add('flag');
                cellNazionale.innerHTML = nazionale.name;
                cellValore.textContent = nazionale.valore;
                cellValore.classList.add('numeric');
                row.classList.add(nazionale.valore%20==0?'even':'odd');
            });
        });
}

// Carica Moltiplicatori
async function loadMoltiplicatori() {
    const response = await fetch(`moltiplicatori.json${getUniqueParam()}`);
    //const response = await fetch('moltiplicatori.json');
    const data = await response.json();
    
    const moltiplicatori = {}; // Popola l'oggetto moltiplicatori
	
	let table = document.getElementById('moltiplicatoriTable').getElementsByTagName('tbody')[0];
    
    Object.entries(data).forEach(([key, value]) => {
        moltiplicatori[key] = value; // Popola l'oggetto con i valori dal JSON
        let row = table.insertRow();
        row.classList.add(value<0?'red':'green');
        let cellKey = row.insertCell(0);
        let cellValue = row.insertCell(1);

        cellKey.textContent = key;
        cellValue.textContent = value;
        cellValue.classList.add('numeric');
    });
	
    return moltiplicatori;
}

// Carica Nazionali
async function loadNazionali(moltiplicatori) {
    const response = await fetch(`nazionali.json${getUniqueParam()}`);
    //const response = await fetch('nazionali.json');
    const data = await response.json();
    
    let table = document.getElementById('nazionaliTable').getElementsByTagName('tbody')[0];

	// Aggiorna il punteggio della nazionale
	data.forEach(nazionale => {
        let punteggio_nazionale = 0;
        Object.entries(nazionale.details).forEach(([key, value]) => {
            if (moltiplicatori[key] !== undefined) {
                punteggio_nazionale += value * moltiplicatori[key];
            }
        });
        nazionale.score = punteggio_nazionale;
    });
    
    // Ordina nazionali per punteggio
    data.sort((a, b) => b.score - a.score);
    
    
    // Carica tabella html
    data.forEach(nazionale => {
        let row = table.insertRow();
        let cellExpand = row.insertCell(0);
        let cellBandiera = row.insertCell(1);
        let cellNazionale = row.insertCell(2);
        let cellPunteggio = row.insertCell(3);

        cellExpand.innerHTML = '<button class="toggle" onclick="toggleDetail(this)"><img src="expand_gray.png"></button>';
        cellExpand.classList.add('expander');
        cellBandiera.innerHTML = `<img class="flag" src="${nazionale.flag}" alt="${nazionale.name}">`;
        cellBandiera.classList.add('flag');
        cellNazionale.innerHTML = nazionale.name;
        cellPunteggio.textContent = nazionale.score;
        cellPunteggio.classList.add('numeric');

        let detailRow = table.insertRow();
        let detailCell = detailRow.insertCell(0);
        detailCell.colSpan = 4;
        detailCell.innerHTML = `<div class="detail" style="display: none;">
                                    <table class="detailTable">
                                        ${Object.entries(nazionale.details)
                                            .filter(([key, value]) => value !== 0)
                                            .map(([key, value]) => `
                                                <tr class="${moltiplicatori[key] < 0 ? 'red' : 'green'}">
                                                    <td></td>
                                                    <td></td>
                                                    <td>${key}</td>
                                                    <td class="numeric">${value * moltiplicatori[key]}</td>
                                                </tr>
                                        `).join('')}
                                    </table>
                                </div>`;
        detailRow.style.display = "none";
    });
	
    return data;
}

// Carica Teams
async function loadTeams(nazionali) {
    const response = await fetch(`teams.json${getUniqueParam()}`);
    //const response = await fetch('teams.json');
    const data = await response.json();
	
    let table = document.getElementById('teamsTable').getElementsByTagName('tbody')[0];
    
	// Itera su ogni squadra
	data.forEach(team => {
        let punteggio_team = 0; // Inizializza il punteggio totale della squadra
                
        // Cerca la nazionale corrispondente nella variabile 'nazionali'
        let nazionale = nazionali.find(n => n.name === team.nazionale_1);
        if (nazionale) { punteggio_team += nazionale.score;    }
        nazionale = nazionali.find(n => n.name === team.nazionale_2);
        if (nazionale) { punteggio_team += nazionale.score;    }
        nazionale = nazionali.find(n => n.name === team.nazionale_3);
        if (nazionale) { punteggio_team += nazionale.score;    }
        nazionale = nazionali.find(n => n.name === team.nazionale_4);
        if (nazionale) { punteggio_team += nazionale.score;    }
            
        // Assegna il punteggio totale calcolato alla proprietà 'punteggio_team' della squadra
        team.score = punteggio_team;
    });
            
    // Ordina team per punteggio
    data.sort((a, b) => b.score - a.score);
    
    // Carica tabella html            
    data.forEach(team => {
        let row = table.insertRow();
        let cellExpand = row.insertCell(0);
        let cellGiocatore = row.insertCell(1);
        let cellPunteggio = row.insertCell(2);

        cellExpand.innerHTML = '<button onclick="toggleDetail(this)"><img src="expand_gray.png"></button>';
        cellExpand.classList.add('expander');
        cellGiocatore.textContent = team.player;
        cellPunteggio.textContent = team.score;
        cellPunteggio.classList.add('numeric');

        let detailRow = table.insertRow();
        let detailCell = detailRow.insertCell(0);
        detailCell.colSpan = 4;
        detailCell.innerHTML = `<div class="detail" style="display: none;">
                                    <table class="detailTable">
                                        ${[team.nazionale_1, team.nazionale_2, team.nazionale_3, team.nazionale_4]
                                            .map(nazionaleName => {
                                                let nazionale = nazionali.find(n => n.name === nazionaleName);
                                                if (nazionale) {
                                                    return `
                                                        <tr>
                                                            <td></td>
                                                            <td class="detailflag"><img src="${nazionale.flag}" alt="${nazionale.name} flag" class="flag"></td>
                                                            <td>${nazionale.name}</td>
                                                            <td class="numeric">${nazionale.score}</td>
                                                        </tr>`;
                                                } else {
                                                    return '';
                                                }
                                            }).join('')}
                                    </table>
                                </div>`;
        detailRow.style.display = "none";
    });
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.replace('selected','unselected');
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.replace('unselected','selected');
}

function toggleDetail(button) {
    let detailRow = button.parentElement.parentElement.nextElementSibling;
    let detailDiv = detailRow.querySelector('.detail');
    if (detailDiv.style.display === "none") {
        detailDiv.style.display = "block";
        detailRow.style.display = "table-row";
        button.innerHTML = '<img src="reduce_gray.png">';
    } else {
        detailDiv.style.display = "none";
        detailRow.style.display = "none";
        button.innerHTML = '<img src="expand_gray.png">';
    }
}

async function init() {
    const moltiplicatori = await loadMoltiplicatori();
    const nazionali = await loadNazionali(moltiplicatori);
    await loadTeams(nazionali);
    loadListone();
}

// Chiama la funzione init al caricamento della pagina
window.onload = init;
