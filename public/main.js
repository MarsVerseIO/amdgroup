var web3;
var chainId = '1';
var provider;
var userAccount = undefined;
var contractAddress = '0xF75396bFD5c51ABdB468E4cc2769DD237a2179B7';
var _Contract;

    let button_connect = $("#connect_metamask");
    $(button_connect).click(async function() {
	connect();
    });
    let button_switch = $("#switch_network");
    $(button_switch).click(async function() {
        switchNetwork();
    });
    let button_deposit = $("#deposit button");
    $(button_deposit).click(async function() {
	let value = parseFloat($("#deposit input").val());
	if (value > 0) {
        	let valueWei = web3.utils.toWei((value).toFixed(8), 'ether');
		deposit(valueWei);
	}
    });
    let button_withdrawal = $("#withdrawal button");
    $(button_withdrawal).click(async function() {
	let value = parseFloat($("#withdrawal input").val());
	if (value > 0) {
        	let valueWei = web3.utils.toWei((value).toFixed(8), 'ether');
		withdrawal(valueWei);
	}
    });

async function switchNetwork() {
	try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: web3.utils.toHex(chainId) }]
            });
        } catch (err) {
            //https://gist.github.com/jessgusclark/f92aa10c2d0f0ca228a04360074bebea
            /* This error code indicates that the chain has not been added to MetaMask */
            if (err.code === 4902 || err.data.originalError.code === 4902) {
                try {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: web3.utils.toHex(chainId),
                            chainName: 'Ethereum Mainnet',
                            nativeCurrency: { name: 'ETH', decimals: 18, symbol: 'ETH' },
                            rpcUrls: ['https://mainnet.infura.io/v3/'],
                            blockExplorerUrls: ['https://etherscan.io']
                        }]
                    });
                } catch (err) {

                }
            }
        }
}

async function connect() {
        provider = typeof window !== "undefined" && typeof window.ethereum !== "undefined" ? window.ethereum : undefined;
        if (provider) {
	    if (typeof provider.removeAllListeners !== "undefined") provider.removeAllListeners();
	    provider.on('chainChanged', handleChainChanged);
	    provider.on('accountsChanged', handleAccountsChanged);
	    provider.on("disconnect", handleDisconnect);
	    provider.on("connect", handleConnect);
	    web3 = new Web3(provider);
	    let accounts = await web3.eth.getAccounts();
	    if (accounts.length == 0) {
	        //метамаск заблокирован
	        await MetaMaskgetAccounts();
	    } else {
	        // получили аккаунт
	        handleAccountsChanged(accounts);
	    }
        } else {
            // встроенного провайдера не сущуствует.
		console.log('встроенного провайдера не сущуствует.');
        }

}

async function MetaMaskgetAccounts() {
    provider.request({ method: 'eth_requestAccounts' }).then().catch((error) => {
        if (error.code === 4001) {
        /* EIP-1193 userRejectedRequest error */
            //console.log('Please connect to MetaMask.');
        } else {
            console.error(error);
        }
    });
}

async function handleChainChanged(chain) {
    chain = (Number(chain)).toString();
    if (chain !== undefined) {
        if (chain !== chainId) {
            $(button_connect).hide();
            $(button_switch).show();
        } else {
            $(button_switch).hide();
            startApp();
        }
    }
}

async function handleAccountsChanged(accounts) {
    web3 = new Web3(provider);
    if (accounts.length === 0) {
        await MetaMaskgetAccounts();
    } else if (web3.utils.toChecksumAddress(accounts[0]) !== userAccount) {
        $(button_connect).hide();
        userAccount = web3.utils.toChecksumAddress(accounts[0]);
        let chain = await provider.request({ method: 'eth_chainId' });
        handleChainChanged(chain);
    } else {
        $(button_connect).hide();
    }
}

async function handleDisconnect() {
    $(button_connect).show();
    $('.user').hide();
}
async function handleConnect() {
    //console.log('Connect');
}

async function startApp() {
	$('#address span').html(userAccount);
	$('.user').show();
	$('#contract').html(contractAddress);
	let ABI = await $.getJSON('/abi.json');
    	_Contract = new web3.eth.Contract(ABI, contractAddress);
	updateBalance();
}

async function updateBalance() {
	let balance = await _Contract.methods.balances(userAccount).call();
	$('#bal_user').html(web3.utils.fromWei(balance, "ether"));
	let balance_contract = await web3.eth.getBalance(contractAddress);
	$('#bal_contract').html(web3.utils.fromWei(balance_contract, "ether"));
}
async function deposit(value) {
	let _balance_user = await web3.eth.getBalance(userAccount);
        if (parseInt(value) > parseInt(_balance_user)) {
            alert('Введённой суммы не хватает на балансе кошелька')
            return;
        }
	$(button_deposit).attr("disabled", true);
        _Contract.methods.deposit().send({ from: userAccount, value: value }).on("transactionHash", function(transactionHash) {
            //console.log(transactionHash);
        }).on("receipt", function(receipt) {
            //console.log(receipt);
	    $(button_deposit).attr("disabled", false);
	    updateBalance();
        }).on("error", function(error) {
            if (error.code == 4001) {
                /* юзер отменил транзакцию */
            } else {
                console.log(error);
            }
	    $(button_deposit).attr("disabled", false);
        });
}
async function withdrawal(value) {
	let _balance = await _Contract.methods.balances(userAccount).call();
        if (parseInt(value) > parseInt(_balance)) {
            alert('Нет столько твоих монет на контракте')
            return;
        }
	$(button_withdrawal).attr("disabled", true);
        _Contract.methods.withdrawal(value).send({ from: userAccount }).on("transactionHash", function(transactionHash) {
            //console.log(transactionHash);
        }).on("receipt", function(receipt) {
            //console.log(receipt);
	    $(button_withdrawal).attr("disabled", false);
	    updateBalance();
        }).on("error", function(error) {
            if (error.code == 4001) {
                /* юзер отменил транзакцию */
            } else {
                console.log(error);
            }
	    $(button_withdrawal).attr("disabled", false);
        });
}