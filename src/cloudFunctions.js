Moralis.Cloud.define("TransferEventFunction", async (request) => {

  const Pixel = Moralis.Object.extend("TransferEvents");
  const query = new Moralis.Query(Pixel);
  query.limit(brdWidth*brdHeight);
  query.distinct("position");
  const results = await query.find(); 
  return results;

}

Moralis.Cloud.beforeSave("TransferEvent", async (request) => {
  	const confirmed = request.object.get("confirmed");
	let newOwner = request.object.get("newOwner");
  	newOwner = newOwner.toLowerCase();
  	let x = parseInt(request.object.get("posx"));
  	let y = parseInt(request.object.get("posy"));
  	let newPrice = parseInt(request.object.get("newPrice"));
  	//const Loggs = Moralis.Object.extend("loggs");
  	const Pixel = Moralis.Object.extend("Pixel");
  	const query = new Moralis.Query(Pixel);
  	query.equalTo('position', x*10000+y); 
  	const results = await query.find(); 
  if (results.length > 0) { // exists: change
      let pix = results[0]; 
      pix.set('color', request.object.get("newColor")); 
      pix.set('owner', newOwner); 
      pix.set('price', newPrice);
      await pix.save();
  }
  else { 					// new: add
    let pix = new Pixel(); 
    pix.set('x', x);
    pix.set('y', y);
    pix.set('position', x*10000+y);
    pix.set('color', request.object.get("newColor")); 
    pix.set('url', request.object.get("newUrl")); 
    pix.set('owner', newOwner);
    pix.set('price', newPrice);
    await pix.save();  

  }
   /*   if (!confirmed) {		// create logg
         
        let boughtlog = new Loggs(); 
        boughtlog.set('pos', pos);
        boughtlog.set('address', newOwner);
        boughtlog.set('trx', request.object.get("transaction_hash"));
        boughtlog.set('bought', parseInt(request.object.get("price")));
        boughtlog.set('sold', 0);
		boughtlog.set('cointoken', request.object.get("cointoken"));
        await boughtlog.save();
  		let soldlog = new Loggs(); 
        soldlog.set('pos', pos);
        soldlog.set('address', request.object.get("formerOwner"));
        soldlog.set('trx', request.object.get("transaction_hash"));
        soldlog.set('bought', 0);
        soldlog.set('sold', parseInt(request.object.get("price")));
        soldlog.set('cointoken', request.object.get("cointoken"));
        await soldlog.save();
      }
  
//  }*/

})