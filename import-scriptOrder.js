$(document).ready(function(){

  if (jQuery.when.all===undefined) {
      jQuery.when.all = function(deferreds) {    
          var deferred = new jQuery.Deferred();
          $.when.apply(jQuery, deferreds).then(
              function() {
                  deferred.resolve(Array.prototype.slice.call(arguments));
              },
              function() {
                  deferred.fail(Array.prototype.slice.call(arguments));
              });

          return deferred;
      }
  }



  //Read CSV file
$(function() {

      // The event listener for the file upload
      document.getElementById('imp-input').addEventListener('change', upload, false);

      // Method that checks that the browser supports the HTML5 File API
      function browserSupportFileUpload() {
          var isCompatible = false;
          if (window.File && window.FileReader && window.FileList && window.Blob) {
          isCompatible = true;
          }
          return isCompatible;
      }

      // Method that reads and processes the selected file
      function upload(evt) {
      if (!browserSupportFileUpload()) {
          alert('The File APIs are not fully supported in this browser!');
          } else {
            var skuArr = [];
              var data = null;
              var reWhiteSpace = new RegExp("/^\s+$/");
              var file = evt.target.files[0];
              var reader = new FileReader();
              reader.readAsText(file);
              reader.onload = function(event) {
                  var csvData = event.target.result;
                  var stitchData = [];
                  //console.log(csvData);
                  data = $.csv.toArrays(csvData);
                  var orderPromises = [];
                  console.log(data);
                  console.log(data.length);
                  for(var n = 0; n < data.length; n++){
                    var orderNum = data[n][3];
                    console.log('current iteration' , n);
                    console.log('current id' , orderNum);
                    console.log('current sku' , data[n][20]);
                    var orderTotal;
                    var orderDateSplit = data[n][5].split(' ');
                    var date = orderDateSplit[0].split('/').reverse().join('-');
                    var dateArr = [];
                    var datesplit = date.split('-');
                    datesplit.forEach(function(value){
                      if (value.length === 1){
                        value = '0' + value;
                      }
                      dateArr.push(value);
                    });
                    console.log('array' , dateArr);
                    var dateStr = dateArr[0] + '-' + dateArr[2] + '-' + dateArr[1];
                    console.log('string' , dateStr);
                    var time = 'T' + orderDateSplit[1] + '-00:00';
                    var orderDate = dateStr + time;
                    var discountAmount;
                    var taxAmount;
                    var shippingTotal;
                    var contactName = data[n][7];
                    var billStreet = data[n][8];
                    var shipStreet = data[n][8];
                    var billStreet2 = data[n][9];
                    var shipStreet2 = data[n][9];
                    var actualBillCity1 = data[n][11];
                    var actualShipCity1 = data[n][11];
                    var actualBillState = data[n][12];
                    var actualShipState = data[n][12];
                    var actualBillZip = data[n][13];
                    var actualShipZip = data[n][13];
                    var country = data[n][14];
                    var contactEmail = data[n][15];
                    var phoneNumber = data[n][16];
                    var nameSplit = contactName.split(' ');
                    var contactFirst = nameSplit[0];
                    var contactLast = nameSplit[nameSplit.length - 1];
                    var allItems = [];
                    var allprices = [];
                    var alltaxes = [];
                    var allshipping = [];

            var itemPrice;
            var singleShip;
            var singleTax;
                    data.forEach(function(lineItem){
                      if(lineItem[3] === orderNum){
                        itemPrice = lineItem[23].replace('$','') * lineItem[22];
                        if (lineItem[32] === undefined || NaN){
                          singleShip = 0;
                        }
                        singleTax = lineItem[24];
                        console.log(singleTax);
                        var singleItem = {
                  "sku": lineItem[20],
                  "name": lineItem[21],
                  "unitPrice": lineItem[23].replace('$',''),
                  "salePrice": lineItem[23].replace('$',''),
                  "quantity": lineItem[22],
                  "totalPrice": itemPrice,
                  "shipping": singleShip,
                  "tax": singleTax
                };
                allItems.push(singleItem);
                allprices.push(singleItem.totalPrice);
                alltaxes.push(singleItem.tax);
                allshipping.push(singleItem.shipping);
                      }
                    });
                    console.log('prices' , allprices);
                    console.log('taxes' , alltaxes);
                    console.log('ship$' , allshipping);
                    if(allprices.length > 1){
                      var orderAmount = _.sum(allprices);
                      orderTotal = parseFloat(orderAmount).toFixed(2);
                    } else {
                      orderTotal = allprices[0];
                    }
                    if(alltaxes.length > 1){
                      var taxTotal = _.sum(alltaxes);
                      console.log(taxTotal);
                      taxAmount = parseFloat(taxTotal).toFixed(2);
                      console.log(taxAmount);
                    } else {
                      taxAmount = alltaxes[0];
                    }
                    if(allshipping.length > 1){
                      var shippingAmount = _.sum(allshipping);
                      shippingTotal = parseFloat(shippingAmount).toFixed(2);
                    } else {
                      shippingTotal = allshipping[0];
                    }

                    var order = {
              order_id: "RANGE-yhst-50863389838911-" + orderNum,
              order_date: orderDate,
              order_total: orderTotal,
              order_discount: '',
              order_tax: taxAmount,
              order_shipping: shippingTotal,
              contact: {
                name: contactName,
                billing: {
                  company: '',
                  street1: billStreet,
                  street2: billStreet2,
                  city: actualBillCity1,  
                  state: actualBillState,
                  zip: actualBillZip,
                  country: country,
                  country_iso: country
                },
                shipping: {
                  company: '',
                  street1: shipStreet,
                  street2: shipStreet2,
                  city: actualShipCity1,
                  state: actualShipState,
                  zip: actualShipZip,
                  country: country,
                  country_iso: country
                },
                people: {
                  firstname: contactFirst,
                  lastname: contactLast,
                  email: contactEmail,
                  phone: phoneNumber
                }
              },
              line_items: 
                allItems
            };

                    console.log('full order' , order);
                    orderPromises.push(order);
                    //Stitch.createSalesOrder(order);
                    var itemsLength = allItems.length - 1;
                    n = n + itemsLength;
                    console.log(n);
                  }

                  return $.when.all(orderPromises)
                  .then(function(order){
                    console.log('orederpromises' , orderPromises);
                    console.log(order);
                    var orderLength = orderPromises.length;
                    console.log('oLength' , orderLength);
                    for (var o = 0; o < orderLength; o++){
                      /*Stitch.createSalesOrder(order[o]);     remove this comment when finished testing*/
                    }
                  });
                  
                  
              };
              reader.onerror = function() {
                  alert('Unable to read ' + file.fileName);
              };
          }
      }
  });


});
