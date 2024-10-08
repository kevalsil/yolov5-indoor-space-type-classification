let model;
let analysisResult;
const imageUpload = document.getElementById('imageUpload');
const instructions = document.getElementById('instructions');
const uploadSection = document.getElementById('uploadSection');
const resultSection = document.getElementById('resultSection');
const uploadedImage = document.getElementById('uploadedImage');
const modelLoadingText = document.getElementById('modelLoading');
const plotImage = document.getElementById('plotImage');

imageUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImage.src = e.target.result;
            uploadedImage.onload = async function() {
                instructions.style.display = 'none';
                uploadSection.style.display = 'none';
                resultSection.classList.remove('hidden');
                await analyzeImage();
            }
        }
        reader.readAsDataURL(file);
    }
});

function analyzeImage() {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select an image file.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch('/analyze', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        analysisResult = data;
        displayResult(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayResult(data) {
    const resultTable = document.getElementById('resultTable');
    resultTable.innerHTML = '';

    const closestRoom = data.closest_room;

    const sortedDistanceTable = data.distance_table.sort((a, b) => a[1] - b[1]);

    sortedDistanceTable.forEach(([room, distance]) => {
        const row = resultTable.insertRow();
        const roomName = room.split('/').pop().split('_')[0];
        const percentage = distance !== null ? (100 - distance * 10).toFixed(2) + '%' : 'N/A';

        if (roomName === closestRoom) {
            row.innerHTML = `<td style="font-weight: bold; color: red;">${roomName}</td>
                            <td style="font-weight: bold; color: red;">${percentage}</td>`;
        } else {
            row.innerHTML = `<td>${roomName}</td>
                            <td>${percentage}</td>`;
        }
    });

    plotImage.src = `data:image/png;base64,${data.plot}`;
}

function downloadResults() {
    fetch('/download_results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisResult),
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'results.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error:', error));
}

function downloadPlot() {
    const link = document.createElement('a');
    link.href = plotImage.src;
    link.download = 'plot.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function returnToMain() {
    resultSection.classList.add('hidden');
    instructions.style.display = 'flex';
    uploadSection.style.display = 'block';
    imageUpload.value = '';
    uploadedImage.src = '';
    plotImage.src = '';
    resultTable.innerHTML = `
        <tr>
            <th>Room Type</th>
            <th>Similarity Score</th>
        </tr>
    `;
}