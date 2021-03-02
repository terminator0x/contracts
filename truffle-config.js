const truffleTeamsUrl = "https://sandbox.truffleteams.com/17b1a2d2-2d88-4bec-8932-c27db063fcba";

module.exports = {
  networks: {
    teams: {
      url: truffleTeamsUrl,
      network_id: 1,
      gas: 5500000,
      confirmations: 1,
      timeoutBlocks: 200
    },
  },
  mocha: {
    timeout: 100000
  },
  compilers: {
    solc: {
      version: '0.7.4',
    }
  }
}