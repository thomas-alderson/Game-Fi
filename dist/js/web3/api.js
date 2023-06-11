// This file sits on webpage and listens for API calls
const BASE_URL = "http://127.0.0.1:3000/api/";
const axios = window.axios.default;

async function handleResponse(rs) {
  if (rs.status !== 200) throw Error("call api false");
  const { data, mess, code } = rs.data;
  return data;
}

async function playerDeath(address) {
  const rs = await axios.post(`${BASE_URL}playerDeath`, { address });
  return await handleResponse(rs);
}

async function withdrawApi(address, amount) {
  const rs = await axios.post(`${BASE_URL}withdraw`, { address, amount });
  return await handleResponse(rs);
}

async function depositApi(address, amount) {
  const rs = await axios.post(`${BASE_URL}deposit`, { address, amount });
  return await handleResponse(rs);
}

async function getBalanceOf(address) {
  const rs = await axios.get(`${BASE_URL}getTicketBalance?address=${address}`); // axios handles the get request to database
  return await handleResponse(rs);
}

// async function withdrawApi(address, amount, provider) {
//   const rs = await axios.post(`${BASE_URL}withdraw`, { address, amount, provider }, {
//     transformRequest: [(data) => {
//       // Exclude 'provider' property from serialization
//       const { provider, ...dataWithoutProvider } = data;
//       return JSON.stringify(dataWithoutProvider);
//     }],
//   });

//   const response = handleResponse(rs);
// }

/*async function startMatch(address) {
  //console.log("startMatch API!")
  const rs = await axios.get(`${BASE_URL}startMatch?address=${address}`);
  return await handleResponse(rs);
}

async function endMatch(address, id, point, matchData) {
  //console.log("endMatch API!")
  const rs = await axios.post(`${BASE_URL}endMatch`, {
    address,
    id,
    point,
    matchData,
  });
  return await handleResponse(rs);
}*/
