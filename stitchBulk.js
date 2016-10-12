// TODO CHANGE THIS FOR RANGER UP WHEN GOING LIVE
// v2/CustomIdTypes
var SKU_CUSTOM_ID = 671687;
var RETAIL_PRICING_ID = 1806759;
var CONTACT_EMAIL_ID = 2058470;
var CONTACT_PHONE_ID = 2058479;
var SIZE_ATTR_ID = 116417953;
var CREDIT_CARD_PAYMENT_ID = 932066;


// Put somewhere in your scripting environment
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

var proxyURL = 'https://springbuck.ch-server.com/~rangerup/stitch/stitchaddcontactbk.php';

var EyStudiosAPI = function() {

}

EyStudiosAPI.post = function(data) {
  return $.ajax({
          url:proxyURL,
          type:"post",
          crossDomain: true,
          async: false,
          data:{ endpoint: data.endpoint, request: JSON.stringify(data.request) },
          dataType: 'json'
        })
}

var EyStudiosDUMP = function() {

}

EyStudiosDUMP.post = function(data) {
  return $.ajax({
          url: 'https://springbuck.ch-server.com/~rangerup/stitch/stitchorder.php',
          type:"post",
          crossDomain: true,
          async: false,
          data:{ json: JSON.stringify(data) },
          dataType: 'json'
        })

}


var Stitch = function(){};

Stitch.getLineItemsForOrder = function(lineItems) {  
  var lineItemsForOrder = []; 
  var lineItemPromises = [];
  var allItemsPromises = [];

  lineItems.forEach(function(lineItem) {
    lineItemPromises.push(Stitch.getVariantIdFromSku(lineItem.sku)); 
  });

  return $.when.all(lineItemPromises)
  .then(function(lineItem) {

    console.log('lineItems' , lineItems);

    console.log('lineItem' , lineItem);

    var length = lineItems.length;
    console.log('LENGTH', length);
    
    var newProductPromises = [];
    
    for (var i = 0; i < length; i++) {
    
      var metaTotal;
      if (length === 1) {
        metaTotal = lineItem[0].meta.total;
      } else {
        metaTotal = lineItem[i][0].meta.total;
      }

      console.log('META TOTAL', metaTotal);
      
      if (metaTotal === "0") { 
        //Did not find a variant so let's create one
        console.log('NEW', lineItems[i]);
        var promise = Stitch.getVariantIdFromCreateOrEdit(lineItems[i]);
        newProductPromises.push(promise);
      } else {
        var variantID;
        if(length === 1){
          variantID = lineItem[0].Variants[0].id;
        } else {
          variantID = lineItem[i][0].Variants[0].id;
        }
        var lineItemObject = Stitch.formatLineItemForOrder(variantID, lineItems[i]);
        lineItemsForOrder.push(lineItemObject);
      }
    }

    if (newProductPromises.length) {
      return $.when.all(newProductPromises)
      .then(function(newProducts) {
          console.log('jfhdsjfhdsjshfjfk', newProducts);
          newProducts.forEach(function(newProduct) {
            lineItemsForOrder.push(newProduct);
          });
        
          return lineItemsForOrder;
      })
    }

    return lineItemsForOrder;    
  })
}

Stitch.getVariantIdFromSku = function(sku){
  var data = {
    endpoint: 'v2/Variants',
    request: {
      action: 'read',
      filter: {
        and: [
          {
            sku: sku
          }
        ]
      }
    }
  };
  
  return EyStudiosAPI.post(data);  
}

Stitch.formatVariantForUpdate = function(variantId, lineItem) {
  console.log(lineItem);
  console.log(lineItem.sku);
  var formattedVariantUpdate = {
      action: "write",
      Variants: [
          {
              id: variantId.Products[0].links.Variants[0].id,
              links: {            
                  VariantCustomIds: [
                      {
                          value: lineItem.sku,
                          links: {
                              CustomIdTypes: [
                                  {
                                      id: SKU_CUSTOM_ID
                                  }
                              ]
                          }
                      }
                  ],
                  VariantPrices: [
                      {
                          value: lineItem.unitPrice,
                          links: {
                              PricingTiers: [
                                  {
                                      id: RETAIL_PRICING_ID
                                  }
                              ]
                          }
                      }
                  ]
              }
          }
      ]
  }

  //console.log(lineItem.attributes.size);
  if (lineItem.attributes) {
    console.log('there is options');
    formattedVariantUpdate.Variants[0].links.AttributeOptions = [];

    _.each(lineItem.attributes, function(attribute) {
      console.log(lineItem.attributes);
      console.log(lineItem.attributes.size);
      var formattedAttribute = {
          value: lineItem.attributes.size,
          links: {
            Attributes: [
            {
              name: 'size'
              //id: SKU_ATTR_ID
            }]
          }
      };
      console.log(formattedAttribute);
      formattedVariantUpdate.Variants[0].links.AttributeOptions.push(formattedAttribute);
    })
  }

  console.log(formattedVariantUpdate);
  return formattedVariantUpdate;
}


Stitch.formatVariantForCreate = function(id, lineItem) {
  var formattedVariantCreate = {
    action: "write",
    Variants: [
        {
            links: {  
                Products: [{
                  id: id
                }],          
                VariantCustomIds: [
                    {
                        value: lineItem.sku,
                        links: {
                            CustomIdTypes: [
                                {
                                    id: SKU_CUSTOM_ID
                                }
                            ]
                        }
                    }
                ],
                VariantPrices: [
                    {
                        value: lineItem.unitPrice,
                        links: {
                            PricingTiers: [
                                {
                                    id: RETAIL_PRICING_ID
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ]
}


if (lineItem.attributes.length) {
  formattedVariantCreate.Variants[0].links.AttributeOptions = [];

  _.each(lineItem.attributes, function(attribute) {
    var formattedAttribute = {
        value: lineItem.attributes.size,
        links: {
          Attributes: [
          {
            //name: 'size', // If attributes exists instead of name you need to provide the id
            id: SKU_ATTR_ID
          }]
        }
    };

    formattedVariantCreate[0].links.AttributeOptions.push(formattedAttribute);
  })
}
  console.log(formattedVariantCreate.Variants[0]);
  console.log(formattedVariantCreate);
  return formattedVariantCreate;
}

Stitch.formatProduct = function(lineItem){
  var formattedProduct = {
        action: "write",
        Products: [{
        name: lineItem.name, 
        links: {
          Variants: [{

          }], 
          PricingTiers: [
          ], 
          ProductTags: [
          ]
        }
      }]
    };
  
  console.log(formattedProduct);
  return formattedProduct;
}

Stitch.createProduct = function(lineItem) {
 var data = {
    endpoint: 'v1/Products',
    request: Stitch.formatProduct(lineItem)
  };

  return EyStudiosAPI.post(data);
}

Stitch.updateVariant = function(variantId, lineItem) {
 var data = {
    endpoint: 'v1/Variants/detail',
    request: Stitch.formatVariantForUpdate(variantId, lineItem)
  };

  return EyStudiosAPI.post(data);
  
}

Stitch.createVariant = function() {
  var data = {
    endpoint: 'v1/Variants',
    request: Stitch.formatVariantForCreate()
  };

  return EyStudiosAPI.post(data);
}

Stitch.getProductByName = function(lineItem){
  var data = {
    endpoint: '/v2/Products',
    request: {
        action: "read",
        filter: {
            and: [
                {
                    name: name
                }, 
                {
                    archived: 0
                }
            ]
        }
    }
  };

  return EyStudiosAPI.post(data);
}



Stitch.getProductById = function(createdProduct){

  var data = {
    endpoint: '/v2/Products/detail',
    request: {
        action: "read",
        Products: [
            {
                id: createdProduct.Products[0].id
            }
        ]
    }
  };

  return EyStudiosAPI.post(data);

}

Stitch.formatLineItemForOrder = function(id, lineItem) {
  var lineItemObject = {};
     lineItemObject.quantity = lineItem.quantity;
     lineItemObject.price = lineItem.unitPrice;
     lineItemObject.tax = lineItem.tax;
     //lineItemObject.discount = lineItem.discount;
     //console.log(lineItem.discount);
     lineItemObject.links = {};
     lineItemObject.links.Variants = [
      {
        id: id
      }
    ];

    return lineItemObject;
}

Stitch.getVariantIdFromCreateOrEdit = function(lineItem) {
  
  // See if product exist /v2/Products filter by name of product
  return Stitch.getProductByName(lineItem)
  .then(function(data){

    // If no product exists create a product
    if(parseInt(data.meta.total) === 0){

      return Stitch.createProduct(lineItem)
       .then(function(createdProduct) {
  
        //get product details and get
        //variant id that was just created
          return Stitch.getProductById(createdProduct)
          .then(function(data) {
             var variantID = data.Products[0].links.Variants[0].id;
            //update that variant
            return Stitch.updateVariant(data, lineItem)
            .then(function(data) {
              return Stitch.formatLineItemForOrder(variantID, lineItem);
            })
          })
       })

      /*.then(Stitch.getProductById)
      .then(Stitch.updateVariant)
      .then(function(variantId) {
        resolve(variantId)
      }); */

    } else {
      
      //else the product does exist so
      //get its details, like id, and create variant
      return Stitch.getProductById(data.Products[0].id)
      .then(Stitch.createVariant)
      .then(function(variantId) {
        console.log(variantId);
        resolve(variantId)
      }); 

    }
  })


  // Look up product detail // Stitch.getProductById to get the variant id

  //Stitch.getProductById()
  
  // Add sku to the variant, add atributes if needed, and price with variantId given from above
  //Stitch.updateVariant()
  // Else if product does exists

  // Add variant from /v1/Variants including sku and price and attributes
  // Stitch.createVariant()
  

  // look up variant we just created and return the variant id

}

// filter for contacts that are not archived
Stitch.getContactByName = function(contact) {
  var data = {
    endpoint: 'v2/Contacts',
    request: {
      action: 'read',
      filter: {
        and: [
          {
            name: contact.name
          }
        ]
      }
    }
  };

  return EyStudiosAPI.post(data);
}

Stitch.getContactById = function(id) {

  console.log(id);
  
  var data = {
    endpoint: 'v2/Contacts/detail',
    request: {
      action: 'read',
      Contacts: [
        {
          id: id
        }
      ]
    }
  };

  return EyStudiosAPI.post(data);
}

Stitch.formatContact = function(contact) {
  var formattedContact = {
    action: 'write',
    Contacts: [
      {
        name: contact.name,
        links: {
          Addresses: [
            {
              contact: contact.name,
              company: contact.billing.company,
              street1: contact.billing.street1,
              street2: contact.billing.street2,
              city: contact.billing.city,
              state: contact.billing.state,
              zip: contact.billing.zip,
              country: contact.billing.country,
              country_iso: contact.billing.country_iso,
              billing: 1,
              shipping: 0
            },
            {
              contact: contact.name,
              company: contact.shipping.company,
              street1: contact.shipping.street1,
              street2: contact.shipping.street2,
              city: contact.shipping.city,
              state: contact.shipping.state,
              zip: contact.shipping.zip,
              country: contact.shipping.country,
              country_iso: contact.shipping.country_iso,
              billing: 0,
              shipping: 1
            }
          ],
          People: [
            {
              first_name: contact.people.firstname,
              last_name: contact.people.lastname,
              links: {
                PersonFields:[
                  {
                    value: contact.people.email,
                    links: {
                      PersonFieldTypes:[
                        {
                          id: CONTACT_EMAIL_ID,
                          type: 'email'
                        }
                      ]
                    }
                  },
                  {
                    value: contact.people.phone,
                    links: {
                      PersonFieldTypes:[
                        {
                          id: CONTACT_PHONE_ID,
                          type: 'PHONE'
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  }

  if (_.isEqual(contact.billing, contact.shipping)) {
    formattedContact.Contacts[0].links.Addresses[0].shipping = 1;
    formattedContact.Contacts[0].links.Addresses.pop();
  }

  return formattedContact;
}

Stitch.createContact = function(contact) {
  var data = {
    endpoint: 'v1/Contacts',
    request: Stitch.formatContact(contact)
  };

  return EyStudiosAPI.post(data);
}

// Match functions should return the match not true or false
Stitch.matchBillingAddress = function(addresses, contact) {
  var matchedBillingAddress = addresses.filter(function(address) {
    return _.isEqual(address.street1.toLowerCase(), contact.billing.street1.toLowerCase()) &&
           _.isEqual(address.street2.toLowerCase(), contact.billing.street2.toLowerCase()) &&
           _.isEqual(address.city.toLowerCase(), contact.billing.city.toLowerCase()) &&
           _.isEqual(address.state.toLowerCase(), contact.billing.state.toLowerCase());
  });

  return matchedBillingAddress;
}

// Match functions should return the match not true or false
Stitch.matchShippingAddress = function(addresses, contact) {
  var matchedShippingAddress = addresses.filter(function(address) {
    return _.isEqual(address.street1.toLowerCase(), contact.shipping.street1.toLowerCase()) &&
           _.isEqual(address.street2.toLowerCase(), contact.shipping.street2.toLowerCase()) &&
           _.isEqual(address.city.toLowerCase(), contact.shipping.city.toLowerCase()) &&
           _.isEqual(address.state.toLowerCase(), contact.shipping.state.toLowerCase());
  });

  return matchedShippingAddress
}

// actually split up the billing and shipping so the above works correct
Stitch.getContactAddresses = function(data) {
  var addresses = _.chain(data.Contacts)
  .flatMap(function(c) {
    return c.links.Addresses
  })
  .filter(function(l) {
    return l.type === 'billing' || l.type === 'shipping'
  })
  .groupBy('type')
  .thru(function(i) {
    return {
      billing: _.map(i.billing, function(b) {
        return data.Addresses[b.id];
      }),
      shipping: _.map(i.shipping, function(s) {
        return data.Addresses[s.id];
      })
    }
  })
  .value();

  return addresses;
}

// General improvements
Stitch.getContactForOrder = function(data, contact) {
    var response = {};

    var addresses = Stitch.getContactAddresses(data);
    
    // we should only be calling these once
    var matchedBillingAddress  = Stitch.matchBillingAddress(addresses.billing, contact);
    var matchedShippingAddress = Stitch.matchShippingAddress(addresses.shipping, contact);

    if (_.isEqual(contact.billing, contact.shipping)) {
      if (matchedBillingAddress.length) {
        // Grab the link right off the match
        response.Contacts = _.get(matchedBillingAddress, '0.links.Contacts');

        return response;
      }

      // We might have matched on a name but we haven't matched
      // on a billing address so lets create a new contact
      return false;
    }

    if (matchedBillingAddress.length) {
      if (matchedShippingAddress.length) {
        // Grab the link right off the match
        response.Contacts = _.get(matchedBillingAddress, '0.links.Contacts');
        
        //grab the ids off the match
        response.Addresses = [{
          id: _.get(matchedBillingAddress, '0.id'),
          type: 'billing'
        }, {
          id: _.get(matchedShippingAddress, '0.id'),
          type: 'shipping'
        }];

        return response;
      }

      // We found the correct contact but a shipping address has changed
      // update the contact then return the updated values
      // Update New Contact return
      return 'update';
    }

    // We might have matched on a name but we haven't matched
    // on a billing address so lets create a new contact
    return false;
}

var foundContactID = "";
var salesID = "";


Stitch.createNewInvoiceForOrder = function(order, id, items) {

  console.log(id);
  console.log(items);

  var data = {
    endpoint: "v1/Invoices",
    request: {
        action: "write",
        Invoices: [
            {
                amount: order.order_total,
                invoice_date: order.order_date,
                payment_due_date: order.order_date,
                discount: order.order_discount,
                s_and_h: order.order_shipping,
                links: {
                    SalesOrders: [
                        {
                            id: id
                        }
                    ],
                    Contacts: [
                        {
                            id: ""
                        }
                    ],
                    InvoicePaymentTypes: [
                        {
                            id: CREDIT_CARD_PAYMENT_ID
                        }
                    ],
                    LineItems:
                        items
                    
                }
            }
        ]
    }
    
  };

  return EyStudiosAPI.post(data);

}

Stitch.createNewInvoicePayment = function(order, id) {

  var data = {
    endpoint: "v1/InvoicePayments",
    request: {
      action:"write",
      InvoicePayments:
      [
        {
          amount: order.order_total,
          paymentDate: order.order_date,
          links:
          {
            InvoicePaymentTypes:
            [
              {
                id: CREDIT_CARD_PAYMENT_ID
              }
            ],
            Invoices:
            [
              {
                id: id
              }
            ]
          }
        }
      ]
    }
    
  };

  return EyStudiosAPI.post(data);

}

Stitch.getSalesOrderForInvoice = function(id) {

  console.log(id);
  
  var data = {
    endpoint: 'v2/SalesOrders/detail',
    request: {
      action: 'read',
      SalesOrders: [
        {
          id: id
        }
      ]
    }
  };

  return EyStudiosAPI.post(data);
}


Stitch.createNewContactForOrder = function(order) {
  var SalesOrderRequestObject = {
    endpoint: "v1/SalesOrders",
    request: {
      action: 'write',
      SalesOrders: [
        {
          order_date: order.order_date,
          po_num: order.order_id,
          total: order.order_total,
          discount: order.order_discount,
          links: {}
        }
      ]
    }
    
  };
  
  return Stitch.createContact(order.contact)
  .then(function(createdContact) {
    console.log(createdContact);
    Stitch.getContactById(createdContact.Contacts[0].id)
    .then(function(newContact) {

      console.log(newContact);
      var foundContactID = createdContact.Contacts[0].id;

      SalesOrderRequestObject.request.SalesOrders[0].links = {
        Contacts: [{
          id: _.get(createdContact, 'Contacts.0.id')
        }],
        Addresses: [
          _.first(_.filter(newContact.Contacts[0].links.Addresses, {type: 'billing'})),
          _.first(_.filter(newContact.Contacts[0].links.Addresses, {type: 'shipping'}))
        ]
      }
      
      Stitch.getLineItemsForOrder(order.line_items)
      .then(function(data) {
        
        SalesOrderRequestObject.request.SalesOrders[0].links.LineItems = data;

        console.log(SalesOrderRequestObject);
             
        return EyStudiosAPI.post(SalesOrderRequestObject)
        .then(function(data){
          console.log(data);
          console.log(data.SalesOrders[0].id);
          Stitch.getSalesOrderForInvoice(data.SalesOrders[0].id)
          .then(function(newOrder){
            var newOrderItems = [];
            var soliLength = newOrder.SalesOrders[0].links.SalesOrderLineItems.length;
            for(var i = 0; i < soliLength; i++){
              var SalesOrderLineItemsID = newOrder.SalesOrders[0].links.SalesOrderLineItems[i].id;
              var newItem = {};
              newItem.id = SalesOrderLineItemsID;//newOrder.SalesOrderLineItems[SalesOrderLineItemsID].links.Variants[0].id;
              newItem.quantity = newOrder.SalesOrderLineItems[SalesOrderLineItemsID].quantity;
              newOrderItems.push(newItem);
            }
            console.log('created order' , newOrder);
            console.log('new Items' , newOrderItems);
            Stitch.createNewInvoiceForOrder(order, data.SalesOrders[0].id, newOrderItems)
            .then(function(createdInvoice){
              console.log('order' , order);
              console.log('Invoice created' , createdInvoice);
              Stitch.createNewInvoicePayment(order, createdInvoice.Invoices[0].id)
            })
          })
        })
      });
    })
  })
}

Stitch.dumpOrderData = function(order) {
  var data = order;
  console.log(data);

  return EyStudiosDUMP.post(data);

}

Stitch.getOrderById = function(order) {
  var data = {
    endpoint: 'v2/SalesOrders',
    request: {
      action: 'read',
      filter: {
        and: [
          {
            po_num: order.order_id,
            operation: '='
          }
        ]
      }
    }
  };

  return EyStudiosAPI.post(data);

}

Stitch.createSalesOrder = function(order) {    
  var SalesOrderRequestObject = {
    endpoint: "v1/SalesOrders",
    request: {
      action: 'write',
      SalesOrders: [
        {
          order_date: order.order_date,
          po_num: order.order_id,
          total: order.order_total,
          discount: order.order_discount,
          links: {}
        }
      ]
    }
    
  };

  //Stitch.dumpOrderData(order)
  //console.log('dump' , order);
  Stitch.getOrderById(order)
  .then(function(exist){
    console.log('exist' , exist);
    if(parseInt(exist.meta.total) === 0){
      console.log('does not exist');
      Stitch.getContactByName(order.contact)
      .then(function(data) {
        console.log(data);

        if (parseInt(data.meta.total) === 0) {
          return Stitch.createNewContactForOrder(order);
        };

        var formattedContactObject = Stitch.getContactForOrder(data, order.contact);
        
        if(!formattedContactObject && !_.isEqual(formattedContactObject)) {
          return Stitch.createNewContactForOrder(order);
          
        }

        //still TODO finish update of contact
        if(formattedContactObject === 'update') {

          var foundContactID = data.Contacts[0].id;
          //return Stitch.createNewContactForOrder(order);
          return Stitch.getContactByName(contact.name)
          .then(function(foundContact){
            console.log(foundContact);

          });
        }
        
        SalesOrderRequestObject.request.SalesOrders[0].links = formattedContactObject;
        Stitch.getLineItemsForOrder(order.line_items)
        .then(function(data) {
          SalesOrderRequestObject.request.SalesOrders[0].links.LineItems = data;
          console.log(SalesOrderRequestObject);      
          return EyStudiosAPI.post(SalesOrderRequestObject)
          .then(function(data){
              console.log(data);
              console.log(data.SalesOrders[0].id);
              Stitch.getSalesOrderForInvoice(data.SalesOrders[0].id)
              .then(function(newOrder){
                var newOrderItems = [];
                var soliLength = newOrder.SalesOrders[0].links.SalesOrderLineItems.length;
                for(var i = 0; i < soliLength; i++){
                  var SalesOrderLineItemsID = newOrder.SalesOrders[0].links.SalesOrderLineItems[i].id;
                  var newItem = {};
                  newItem.id = SalesOrderLineItemsID;//newOrder.SalesOrderLineItems[SalesOrderLineItemsID].links.Variants[0].id;
                  newItem.quantity = newOrder.SalesOrderLineItems[SalesOrderLineItemsID].quantity;
                  newOrderItems.push(newItem);
                }
                console.log('created order' , newOrder);
                console.log('new Items' , newOrderItems);
                Stitch.createNewInvoiceForOrder(order, data.SalesOrders[0].id, newOrderItems)
                .then(function(createdInvoice){
                  console.log('order' , order);
                  console.log('Invoice created' , createdInvoice);
                  Stitch.createNewInvoicePayment(order, createdInvoice.Invoices[0].id)
                })
              })
            })
        }).catch(function(err){
          console.log(err);
        });
      })

    }
    console.log('does exist');
  })
}