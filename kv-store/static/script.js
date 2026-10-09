const API_BASE_URL = ""; // FastAPI serves this, so relative paths work

// DOM Elements
const newServerIdInput = document.getElementById('new-server-id');
const addServerBtn = document.getElementById('add-server-btn');
const physicalServerListUl = document.getElementById('physical-server-list');
const physicalServerCountSpan = document.getElementById('physical-server-count');
const virtualNodeCountSpan = document.getElementById('virtual-node-count');
const hashRingListUl = document.getElementById('hash-ring-list');

const putKeyInput = document.getElementById('put-key');
const putValueInput = document.getElementById('put-value');
const putBtn = document.getElementById('put-btn');
const getKeyInput = document.getElementById('get-key');
const getBtn = document.getElementById('get-btn');
const kvResultDiv = document.getElementById('kv-result');

const serverDataDisplayDiv = document.getElementById('server-data-display');
const systemLogsDiv = document.getElementById('system-logs');

function logMessage(message, isError = false) {
    const p = document.createElement('p');
    const timestamp = new Date().toLocaleTimeString();
    p.textContent = `[${timestamp}] ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}`;
    if (isError) {
        p.classList.add('error');
    }
    systemLogsDiv.insertBefore(p, systemLogsDiv.firstChild);
    if (systemLogsDiv.children.length > 30) { // Limit log lines
        systemLogsDiv.removeChild(systemLogsDiv.lastChild);
    }
}

async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
            logMessage(`API Error (${response.status}): ${data.detail || JSON.stringify(data)}`, true);
            throw new Error(data.detail || `HTTP error ${response.status}`);
        }
        return data;
    } catch (error) {
        logMessage(`Network/Fetch Error: ${error.message}`, true);
        throw error; // Re-throw for caller to handle if needed
    }
}

function renderServerData(server) {
    const serverBox = document.createElement('div');
    serverBox.classList.add('server-data-box');
    serverBox.id = `data-box-${server.server_id}`;

    const title = document.createElement('h3');
    title.textContent = `Server: ${server.server_id} (${server.status})`;
    if (server.status === 'DOWN') title.classList.add('status-DOWN');
    serverBox.appendChild(title);

    if (Object.keys(server.data).length > 0) {
        const dataList = document.createElement('ul');
        for (const [key, item] of Object.entries(server.data)) {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${key}</strong>: 
                                 Value: <code>${JSON.stringify(item.value)}</code>, 
                                 Version: ${item.version}`;
            dataList.appendChild(listItem);
        }
        serverBox.appendChild(dataList);
    } else {
        const p = document.createElement('p');
        p.textContent = 'No data stored.';
        serverBox.appendChild(p);
    }
    // Display virtual node hashes for this server
    if (server.virtual_node_hashes && server.virtual_node_hashes.length > 0) {
        const vnodeInfo = document.createElement('p');
        vnodeInfo.style.fontSize = '0.8em';
        vnodeInfo.style.color = '#555';
        vnodeInfo.innerHTML = `<strong>Virtual Nodes Hashes:</strong> ${server.virtual_node_hashes.join(', ')}`;
        serverBox.appendChild(vnodeInfo);
    }

    return serverBox;
}


async function refreshAllUIData() {
    try {
        const details = await fetchData(`${API_BASE_URL}/ui/details`);
        
        // Render Physical Servers List
        physicalServerListUl.innerHTML = '';
        physicalServerCountSpan.textContent = details.servers.length;
        details.servers.forEach(server => {
            const li = document.createElement('li');
            li.textContent = `${server.server_id}`;
            if (server.status === 'DOWN') li.classList.add('status-DOWN');

            const statusBtn = document.createElement('button');
            statusBtn.textContent = server.status === 'UP' ? 'Set DOWN' : 'Set UP';
            statusBtn.classList.add(server.status === 'UP' ? 'toggle-down' : 'toggle-up');
            statusBtn.onclick = () => toggleServerStatus(server.server_id, server.status);
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.style.backgroundColor = '#6c757d'; // Grey
            removeBtn.onclick = () => removeServer(server.server_id);

            const btnGroup = document.createElement('div');
            btnGroup.appendChild(statusBtn);
            btnGroup.appendChild(removeBtn);
            li.appendChild(btnGroup);
            physicalServerListUl.appendChild(li);
        });

        // Render Hash Ring (Virtual Nodes)
        hashRingListUl.innerHTML = '';
        virtualNodeCountSpan.textContent = details.hash_ring_tuples.length;
        details.hash_ring_tuples.forEach(node_tuple => {
            const li = document.createElement('li');
            li.innerHTML = `Hash: ${node_tuple[0]} → <span class="server-id-highlight">${node_tuple[1]}</span>`;
            hashRingListUl.appendChild(li);
        });
        if (details.hash_ring_tuples.length === 0) {
             hashRingListUl.innerHTML = '<li>Ring is empty. Add servers.</li>';
        }


        // Render Individual Server Data Storage
        serverDataDisplayDiv.innerHTML = ''; // Clear previous
        details.servers.forEach(server => {
            serverDataDisplayDiv.appendChild(renderServerData(server));
        });
        if (details.servers.length === 0) {
            serverDataDisplayDiv.innerHTML = '<p>No servers to display data for.</p>';
        }


    } catch (error) {
        // Error already logged by fetchData
    }
}

addServerBtn.addEventListener('click', async () => {
    const serverId = newServerIdInput.value.trim();
    if (!serverId) {
        logMessage("Server ID cannot be empty.", true);
        return;
    }
    try {
        const result = await fetchData(`${API_BASE_URL}/servers/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ server_id: serverId })
        });
        logMessage(result.message || `Server ${serverId} action initiated.`);
        newServerIdInput.value = '';
        refreshAllUIData();
    } catch (error) {/* Already logged */}
});

async function removeServer(serverId) {
    if (!confirm(`Are you sure you want to remove server ${serverId}? This will lose its data in this demo.`)) {
        return;
    }
    try {
        const result = await fetchData(`${API_BASE_URL}/servers/${serverId}`, { method: 'DELETE' });
        logMessage(result.message || `Server ${serverId} removal initiated.`);
        refreshAllUIData();
    } catch (error) {/* Already logged */}
}

async function toggleServerStatus(serverId, currentStatus) {
    const newStatus = currentStatus === 'UP' ? 'DOWN' : 'UP';
    try {
        const result = await fetchData(`${API_BASE_URL}/servers/${serverId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        logMessage(result.message || `Server ${serverId} status update initiated.`);
        refreshAllUIData();
    } catch (error) {/* Already logged */}
}

putBtn.addEventListener('click', async () => {
    const key = putKeyInput.value.trim();
    const valueStr = putValueInput.value.trim(); // Value is a string from input
    if (!key || valueStr === "") {
        logMessage("Key and Value cannot be empty for PUT.", true);
        return;
    }
    // Attempt to parse value as JSON, otherwise use as string
    let value;
    try {
        value = JSON.parse(valueStr);
    } catch (e) {
        value = valueStr;
    }

    kvResultDiv.textContent = 'Processing PUT...';
    try {
        const result = await fetchData(`${API_BASE_URL}/kv/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: value })
        });
        kvResultDiv.textContent = JSON.stringify(result, null, 2);
        logMessage(`PUT ${key}: ${result.message || JSON.stringify(result)}`);
        refreshAllUIData(); // Refresh server data views
    } catch (error) {
        kvResultDiv.textContent = `PUT Error: ${error.message}`;
    }
});

getBtn.addEventListener('click', async () => {
    const key = getKeyInput.value.trim();
    if (!key) {
        logMessage("Key cannot be empty for GET.", true);
        return;
    }
    kvResultDiv.textContent = 'Processing GET...';
    try {
        const result = await fetchData(`${API_BASE_URL}/kv/${key}`);
        kvResultDiv.textContent = JSON.stringify(result, null, 2);
        logMessage(`GET ${key}: Retrieved value for key (see result box).`);
    } catch (error) {
        kvResultDiv.textContent = `GET Error: ${error.message}`;
         // If 404, backend already sends detail, fetchData logs it.
    }
});

// Initial Load
refreshAllUIData();
// You might want to add a manual refresh button instead of polling for a demo
// setInterval(refreshAllUIData, 10000); // Refresh every 10 seconds