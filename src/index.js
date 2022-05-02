/* Moralis init code */
const { xorWith, isUndefined } = require('lodash');
Moralis  = require('moralis');
const serverUrl = "https://iehurrvmlviq.usemoralis.com:2053/server";
const appId = "YAkoEpwpNoorfAHNfsfv9evYr71Q8RJyrfVrJRA1";
const contract = "0xf1cb22D645E0A6DA68Fa8A4B535FC30E7e079910"; 
const coinName = "MATIC";

Moralis.start({ serverUrl, appId });
const web3 = Moralis.enableWeb3();
import Moralis from 'moralis';
import { show, hide, message, toPaintMode, toLookMode, toBNB, toLoggedOut, getBoardCoords } from './func';
 
var user;
global.userAddress = '';
global.brdWidth = 765;          // number of pixels
global.brdHeight= 340;
var xLimit      = brdWidth+1;   // limiter for cycles
var yLimit      = brdHeight+1; 
global.nftMinSize   = 10;
global.nftMaxSize   = 60; 
global.nftToSave    = [];
global.brdPixSize   = 2;        // size of pixel to show
// board canvas
global.board    = document.getElementById("board");
board.width     = brdWidth*brdPixSize;
board.height    = brdHeight*brdPixSize;
global.brdX     = 0;
global.brdY     = 0; 
global.brdW     = 0; 
global.brdH     = 0; 
global.brdInitColor = "black";

var cursor = document.getElementById("cursor");
global.crsSize  = 25;           // number of pixels in cursor
cursor.width    = crsSize*brdPixSize;
cursor.height   = crsSize*brdPixSize;
global.crsX     = 0;
global.crsY     = 0; 
global.crsPixX  = 0;
global.crsPixY  = 0;
var crsTaken    = false;

var screen = document.getElementById("screen"); 
global.scrSize      = crsSize;      // number of pixels in screen
global.scrPixSize   = 10;           // size of pixel in the screen
global.scrColor     = "#FF0000";    // initial color 
document.getElementById("color").value = scrColor;
global.scrPixels    = new Array(scrSize);  // pixels of screen
for (var i=0; i<scrSize; i++) {
    scrPixels[i] = new Array(scrSize);
    for (var j=0; j<scrSize; j++) { scrPixels[i][j] = ''; }
}
screen.width        = scrPixSize*scrSize;
screen.height       = scrPixSize*scrSize;
var scrPrevX            = -1;
var scrPrevY            = -1;
var scrPainted          = false;

//global.mintMode     = false;
global.editMode     = false;
global.lookMode     = true;
global.screenMode   = false; 
global.pipetteMode  = false; 
global.markedPrice  = 0;  
global.markedCount  = 0; 

var prevUrl         = "==="; 

global.svmX = 0;
global.svmY = 0;

// params###########################

var initPrice = 1000000000000000;
var masterfee = 1;
var maxPaintCount = 100; 
var color   = new Array(brdWidth)
var owner   = new Array(brdWidth)
var url     = new Array(brdWidth)
var price   = new Array(brdWidth);
for(var x = 1; x < xLimit; x++)  {
    color[x]  = new Array(brdHeight);
    url[x]  = new Array(brdHeight);
    owner[x]  = new Array(brdHeight);
    price[x]= new Array(brdHeight);
    for (var y = 1; y < yLimit; y++) {
        color[x][y] = brdInitColor;
        url[x][y] = "";
        owner[x][y] = "";
        price[x][y] = initPrice;
    }
}
async function loggerIn() {    
    user = await Moralis.User.current();
    console.log("(loggerIn): user=" + user.get("ethAddress"));
    if (isUndefined(user)) { toLoggedOut(); }
    else { userAddress = user.get("ethAddress"); toLoggedIn(); }
}
async function toLoggedIn() {
    console.log("loggedIn mode");
    hide("login");
    user = await Moralis.User.current();
    document.getElementById("loginmessage").innerHTML = user.get("ethAddress");
    show("logout");
    show("loggs");
    show("edit");
} 
async function login() { 
    user = Moralis.User.current(); 
    if (!user) {
        user = await Moralis.authenticate({ signingMessage: "Log in to theBoard" })
        .then(function (user) {
            console.log("logged in useraddress: " + user.get("ethAddress")); 
            toLoggedIn();
            userAddress = user.get("ethAddress");
        })
        .catch(function (error) { console.log(error); });
    }
}
async function logOut() {
    await Moralis.User.logOut(); 
    console.log("logged out");
    toLoggedOut();
    userAddress = '';
}
document.getElementById("login").onclick = login;
document.getElementById("logout").onclick = logOut; 
async function getPixelsEvent() { 
    const params = {};
    const pixels = await Moralis.Cloud.run("TransferEventFunction", params);
    console.log("found " + pixels.length + " pixels");
    for (var i=0; i<pixels.length; i++) { 
        let p = pixels[i]; 
        let x = parseInt(p.get('position') / 10000);
        let y = p.get('position') % 10000;
        let colorurl = [];
        let c = '';
        if ((x>0) && (y>0) && (x<xLimit) && (y<yLimit)) {
            c           = p.get('newColorUrl');
            colorurl    = c.split('|');
            color[x][y] = colorurl[0]; 
            url[x][y]   = colorurl[1];
            owner[x][y] = p.get('newOwner');
            price[x][y] = parseInt(p.get('newPrice')); 
        }
    }
    console.log("(getPixelsEvent) - out");
    return color;
} 
// отрисовка картинки
async function drawBoard() {
    console.log("(drawBoard)");
    color = await getPixelsEvent();
    for(var x = 1; x < xLimit; x++) {
        for(var y = 1; y < yLimit; y++) { 
            brd.fillStyle = color[x][y];
            brd.fillRect((x-1) * brdPixSize, (y-1) * brdPixSize, brdPixSize, brdPixSize);
        }
    }
    console.log("(drawBoard) out");
}
function refresh() {
    console.log("(refresh)"); 
    toLookMode();
    loggerIn();
    drawBoard();
    //getBoardCoords(e.clientX, e.clientY);
    message("look mode: refreshed");    
}
/*function getnftSize(x, y, w) { 
    for (var j = 0; j <= nftMaxSize; j++) {
        for (var i = 0; i <= w; i++) { 
            if (owner[x+i][y+j] != userAddress) { if (j > nftMinSize) { return w * j; } { return 0; } }
        }
    }
    if (j >= nftMinSize) { return w * j; } { return 0; }
}
document.getElementById("mint").addEventListener("click", async function (e) { 
    toMintMode(); 
    console.log("mintMode=" + mintMode); 
    if (userAddress == '') {
        toLookMode();
        message("log in first");
    }
    else {
        console.log("useraddress: " + userAddress) 
        let bignftStartX    = 0;
        let bignftStartY    = 0;
        let bignftSizeX     = 0;
        let bignftSizeY     = 0; 
        let bignftEndX      = 0;
        let bignftEndY      = 0;
        for(var x = 1; x < xLimit; x++) {
            for(var y = 1; y < yLimit; y++) { 
                if (owner[x][y] == userAddress) {
                    ////////////////////////////////////////////
                    for (var w = nftMinSize; w <= nftMaxSize; w++){
                        let nftSize = getnftSize(x, y, w);
                        if ((bignftSizeX * bignftSizeY) < nftSize) {
                            bignftStartX    = x;
                            bignftStartY    = y;
                            bignftSizeX     = w;
                            bignftSizeY     = nftSize / w; 
                            bignftEndX      = bignftStartX + bignftSizeX - 1;
                            bignftEndY      = bignftStartY + bignftSizeY - 1;
                    
                            console.log("nft Start" + x + "|" + y + " nft End" + bignftEndX + "|" + bignftEndY + " sizeX=" + bignftSizeX + " sizeY=" + bignftSizeY);
                        }
                    }
                }
            }
        }
        console.log("nft search ended");
        if ((bignftSizeX >= nftMinSize) && (bignftSizeY >= nftMinSize)) {
            brd.fillStyle = "yellow";
            brd.fillRect((bignftStartX-1) * brdPixSize, (bignftStartY-1) * brdPixSize, (bignftSizeX+1) * brdPixSize, bignftSizeY * brdPixSize); 
            show("mintmenu");
            document.getElementById("mintmenu").style.left  = (bignftEndX + bignftSizeX) * brdPixSize + "px";
            document.getElementById("mintmenu").style.top   = (bignftEndY + bignftSizeY) * brdPixSize + "px";
            nftToSave[0] = bignftStartX;
            nftToSave[1] = bignftStartY;
            nftToSave[2] = bignftEndX;
            nftToSave[3] = bignftEndY;
            
        }
    }

})
document.getElementById("closemint").addEventListener("click", function() { toLookMode(); refresh(); loggerIn(); })
document.getElementById("savemint").addEventListener("click", async function() { 
    const ABI = [ 
        {   inputs: [   { internalType: "uint256", name: "_xs", type: "uint256" },
                        { internalType: "uint256", name: "_ys", type: "uint256" }, 
                        { internalType: "uint256", name: "_xe", type: "uint256" }, 
                        { internalType: "uint256", name: "_ye", type: "uint256" } ],
            name:               "createPicture",
            outputs:            [],
            stateMutability:    "nonpayable",
            type:               "function" } ];
    
    const options = {
        contractAddress:    contract,
        functionName:       "createPicture",
        abi: ABI,
        params: {
            _xs: nftToSave[0],
            _ys: nftToSave[1],
            _xe: nftToSave[2],
            _ye: nftToSave[3] },
        msgValue: 0, };
    try {
        console.log("createPicture metamask confirmation...");
        const paintresult = await Moralis.executeFunction(options);
        console.log(JSON.stringify(paintresult));
        console.log("metamask confirmed transactionHash: " + paintresult['transactionHash']);
        alert("successful nft creation"); 
    }
    catch (e) { 
        message("failed creation");
        console.log(e);
    }
    toLookMode(); refresh(); loggerIn(); 
})
*/
document.getElementById("edit").addEventListener("click", function (e) { 
    toPaintMode(); 
    getBoardCoords(e.clientX, e.clientY); 
    console.log("editMode=" + editMode + ", markedCount=" + markedCount);
})
document.getElementById("refresh").onclick = refresh;
document.getElementById("board").addEventListener("click", function (e) {
    console.log("(board - click)");
    if (editMode && !screenMode) { 
        getBoardCoords(e.clientX, e.clientY);
        drawCursor();
        message("<b>paint mode:</b> click on segment to edit it");
    }
    if (lookMode) {
        let px = parseInt((e.clientX - brdX) / brdPixSize); // pixel coords
        let py = parseInt((e.clientY - brdY) / brdPixSize);
        if (url[px][py] != "") {let win = window.open("https://" + url[px][py]);}
    }
    console.log("(board - click) out");
})
document.getElementById("board").addEventListener("mousemove", function (e) {
    if (lookMode) {
        getBoardCoords();
        let px = parseInt((e.clientX - brdX) / brdPixSize)+1; // pixel coords
        let py = parseInt((e.clientY - brdY) / brdPixSize)+1;
        if (url[px][py] != prevUrl) {
            if ((px>0) && (px<xLimit) && (py>0) && (py<yLimit)) {
                console.log("pixel " + px + "|" + py + " url: " + url[px][py]);
                for(var x = 1; x < xLimit; x++)  {
                    for (var y = 1; y < yLimit; y++) {
                        if (url[x][y] == prevUrl) {
                            brd.fillStyle = color[x][y];
                            brd.fillRect((x-1) * brdPixSize, (y-1) * brdPixSize, brdPixSize, brdPixSize);
                        }
                        if (url[x][y] == url[px][py] && url[px][py] != "") { 
                            brd.fillStyle = "white";
                            brd.fillRect((x-1) * brdPixSize, (y-1) * brdPixSize, brdPixSize, brdPixSize);
                        }
                    }
                }
                prevUrl = url[px][py];
                if (url[px][py]=="") { message("."); }
                else { message("https://" + url[px][py]); }
            }   
        }
    }
})
function drawCursor() { 
    if (editMode) {
        document.getElementById("cursor").style.top = crsY + "px";
        document.getElementById("cursor").style.left = crsX + "px";
        crs.strokeStyle = "red";
        crs.strokeRect(0, 0, crsSize*brdPixSize, crsSize*brdPixSize);
        show("cursor");
    }
}
 
document.getElementById("cursor").addEventListener("mousedown", function() { crsTaken = true })
document.getElementById("cursor").addEventListener("mouseup", function() { crsTaken = false })
document.getElementById("cursor").addEventListener("mousemove", function(e) { 
    if (crsTaken && !screenMode) {
        getBoardCoords(e.clientX, e.clientY); 
        drawCursor(crsX, crsY);
    }
})
document.getElementById("cursor").addEventListener("dblclick", function(e) {
    if (!screenMode) {
        console.log("(cursor dblclick)");
        screenMode = true; 
        getBoardCoords(e.clientX, e.clientY);
        show("savemenu"); 
        show("color");
        pipetteMode = false;
        // clear scrPixels
        for (var i = 0; i<scrSize; i++) { 
            for (var j = 0; j<scrSize; j++) { scrPixels[i][j] = ""; }
        }
        drawScreen();
    }
})

function drawScreen() {
    console.log("drawScreen()");
    if (editMode) {
        scr.lineWidth = "1";
        scr.strokeStyle = "red";
        for (var i = 0; i<scrSize; i++) { 
            for (var j = 0; j<scrSize; j++) { 
                if (scrPixels[i][j] == "") {
                    scr.fillStyle = color[i+crsPixX][j+crsPixY]; 
                }
                else {
                    scr.fillStyle = scrPixels[i][j]; 
                }
                scr.fillRect(i*scrPixSize, j*scrPixSize, scrPixSize, scrPixSize);
                scr.strokeRect(i*scrPixSize, j*scrPixSize, scrPixSize, scrPixSize); 
            }
        }
    }
    console.log("drawScreen() - out");
}
document.getElementById("color").addEventListener("change", function() { scrColor = document.getElementById("color").value; })
document.getElementById("closescreen").addEventListener("click", function() { toLookMode(); loggerIn(); })
document.getElementById("screen").addEventListener("mousedown", function() { scrPainted = true })
document.getElementById("screen").addEventListener("mouseup", function() { scrPainted = false })
document.getElementById("screen").addEventListener("mousemove", function(e) { 
    console.log("screen - mousemove: scrPainted=" + scrPainted);
    if (scrPainted) {
        //getBoardCoords(e.clientX, e.clientY); 
        let scrCoords = document.getElementById("screen").getBoundingClientRect();
        let px = parseInt((e.clientX - scrCoords.left)/scrPixSize);
        let py = parseInt((e.clientY - scrCoords.top)/scrPixSize);
        if ((markedCount <= maxPaintCount) && (px != scrPrevX) || (py != scrPrevY)) {
            console.log("pixelColor=" + scrPixels[px][py]);
            if (scrPixels[px][py] != '') { 
                scrPixels[px][py] = scrColor; 
                scr.fillStyle = scrPixels[px][py];
                scr.fillRect(px*scrPixSize, py*scrPixSize, scrPixSize, scrPixSize);
                scr.strokeStyle = "red";
                scr.strokeRect(px*scrPixSize, py*scrPixSize, scrPixSize, scrPixSize); 
                console.log("marked: " + markedCount);
                console.log("screen click: " + px + "|" + py);   
                message("marked pixes: " + markedCount + " total price: " + toBNB(parseInt(markedPrice*101/100)));                 
            }

            if ((markedCount < maxPaintCount) && (scrPixels[px][py] == '')){ 
                console.log("scrColor=" + scrColor);
                markedCount++;
                markedPrice = markedPrice + price[px+crsPixX][py+crsPixY];
                scrPixels[px][py] = scrColor; 
                scr.fillStyle = scrPixels[px][py];
                scr.fillRect(px*scrPixSize, py*scrPixSize, scrPixSize, scrPixSize);
                scr.strokeStyle = "red";
                scr.strokeRect(px*scrPixSize, py*scrPixSize, scrPixSize, scrPixSize); 
                console.log("marked: " + markedCount);
                console.log("screen click: " + px + "|" + py);   
                message("marked pixes: " + markedCount + " total price: " + toBNB(parseInt(markedPrice*101/100))); 
            }
            else { message("max " + (maxPaintCount) + " pixels per painting"); }
        }
        scrPrevX = px;
        scrPrevY = py;
    }
})
document.getElementById("pipette").addEventListener("click", function() { 
    if (pipetteMode) {
        pipetteMode = false; 
        document.getElementById("pipette").innerHTML = "Pippete";
        show("color");
    }
    else {
        pipetteMode = true; 
        document.getElementById("pipette").innerHTML = "or close pippete";
        hide("color");
    }
})
document.getElementById("screen").addEventListener("click", function(e) { 
    console.log("screen click");
    let scrCoords = document.getElementById("screen").getBoundingClientRect();
    let px = parseInt((e.clientX - scrCoords.left)/scrPixSize);
    let py = parseInt((e.clientY - scrCoords.top)/scrPixSize);
    if (pipetteMode) {
        if ((scrPixels[px][py] == '') && (price[px+crsPixX][py+crsPixY] > initPrice)) { scrColor = color[px+crsPixX][py+crsPixY]; }
        if (scrPixels[px][py] != '') { scrColor = scrPixels[px][py]; }
        document.getElementById("color").value = scrColor;
        pipetteMode = false;
        document.getElementById("pipette").innerHTML = "Pipette";
        show("color");
    }
    else {
        if ((markedCount<(maxPaintCount+1) && scrPixels[px][py] != '') || (markedCount<maxPaintCount && scrPixels[px][py] == '')){
            if (scrPixels[px][py] == '') {
                console.log("scrColor=" + scrColor);
                scrPixels[px][py] = scrColor; 
                markedCount++;
                markedPrice = markedPrice + price[px+crsPixX][py+crsPixY];
                scr.fillStyle = scrPixels[px][py];
                scr.fillRect(px*scrPixSize, py*scrPixSize, scrPixSize, scrPixSize);
            } 
            else { 
                scrPixels[px][py] = ''; 
                markedCount--;
                markedPrice = markedPrice - price[px+crsPixX][py+crsPixY];
                scr.fillStyle = color[px+crsPixX][py+crsPixY];
                scr.fillRect(px*scrPixSize, py*scrPixSize, scrPixSize, scrPixSize);
            }
            scr.strokeStyle = "red";
            scr.strokeRect(px*scrPixSize, py*scrPixSize, scrPixSize, scrPixSize); 
            console.log("marked: " + markedCount + " markedPrice: " + markedPrice);
            console.log("screen click: " + px + "|" + py);   
            message("marked pixes: " + markedCount + " total price: " + toBNB(parseInt(markedPrice*101/100))); 
        }
        else { message("max " + (maxPaintCount) + " pixels per painting"); }
    }
})
//  
document.getElementById("saveCoin").addEventListener("click", async function () {
    hide("savemenu");
    hide("color");
    hide("logout");
    hide("cursor"); 
    hide("refresh");
    lookMode    = false;
    editMode    = false; 
    let xMarkedPos = [];
    let yMarkedPos = [];
    let markedColorUrl = []; 
    let l = 0; 
    for (var i=0; i<scrSize; i++) {
        for (var j=0; j<scrSize; j++) {
            if (scrPixels[i][j] != '') {
                xMarkedPos[l]   = (i+crsPixX);
                yMarkedPos[l]   = (j+crsPixY); 
                markedColorUrl[l] = scrPixels[i][j] + "|" + document.getElementById("url").value; 
                l++; 
            };
        }
    } 
    console.log("action: purchasePixels with cost: " + parseInt(markedPrice*(100+masterfee)/100) + " [" + xMarkedPos + "] [" + yMarkedPos + "] " + markedColorUrl);
    
    const ABI = [ 
        {   inputs:[{ internalType: "uint256[]",    name: "_xpos",      type: "uint256[]" },
                    { internalType: "uint256[]",    name: "_ypos",      type: "uint256[]" },
                    { internalType: "string[]",     name: "_colorurl",  type: "string[]" },
                    { internalType: "uint256",      name: "_maxPayment", type: "uint256" } ],
            name:               "purchasePixels",
            outputs:            [],
            stateMutability:    "payable",
            type:               "function"
        } ];
    
    const options = {
        contractAddress:    contract,
        functionName:       "purchasePixels",
        abi: ABI,
        params: {
            _xpos:          xMarkedPos,
            _ypos:          yMarkedPos,
            _colorurl:      markedColorUrl,
            _maxPayment:    0
        },
        msgValue: parseInt(markedPrice*(100+masterfee)/100),
    };
    try {
        console.log("metamask confirmation...");
        const paintresult = await Moralis.executeFunction(options);
        console.log(JSON.stringify(paintresult));
        console.log("metamask confirmed transactionHash: " + paintresult['transactionHash']);
        message("successful painting"); 
    }
    catch (e) { 
        message("failed painting");
        console.log(e);
    }
    drawBoard();
    loggerIn();
    toLookMode();

});

var brd = board.getContext("2d")
var crs = cursor.getContext("2d")
var scr = screen.getContext("2d")

loggerIn(); 
drawBoard(); 

