export default function requestHelper(url, options) {
  return fetch(url, options)
    .then(response => {
      return response.json().then((d) => {
        return Promise.resolve(d);
      }).catch((error) => {
        return Promise.reject(error);
      })
    })
    .catch((errorResponse) => {
      return Promise.reject(errorResponse);
    });
}
