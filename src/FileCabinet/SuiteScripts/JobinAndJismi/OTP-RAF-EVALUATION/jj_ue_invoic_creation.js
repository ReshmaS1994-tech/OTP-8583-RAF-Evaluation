/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/log", "N/record", "N/search"], /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
(log, record, search) => {
  /**
   * Defines the function definition that is executed before record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const beforeSubmit = (scriptContext) => {
    try {
       transformToInvoiceIfShipped(scriptContext);
    }
     catch (error) {
      log.error("error", error.message);
      errorMessage = error.message;
   
    }
  };

  function  transformToInvoiceIfShipped(scriptContext)
  { try{
        let newRec = scriptContext.newRecord;
      log.debug("inside...");

      const fulfillmentstatus = newRec.getText({ fieldId: "status" });
      let soId = newRec.getValue({ fieldId: "createdfrom" });
       if (fulfillmentstatus === "Shipped") {
        log.debug("inside if");

        var objRecord = record.transform({
          fromType: record.Type.SALES_ORDER,
          fromId: soId,
          toType: record.Type.INVOICE,
          isDynamic: true,
        });

        var lineCount = objRecord.getLineCount({ sublistId: 'item' });
        for (var i=lineCount-1; i>= 0; i--)
             {
        var qty = objRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: i
        });
        if (!qty || qty == 0) 
            {
          objRecord.removeLine({
            sublistId: 'item',
            line: i
          });
        }
      }
 let invoiceNumber = objRecord.save();

        if (invoiceNumber) {
          newRec.setValue({
            fieldId: "custbody_jj_invoice_number",
            value: invoiceNumber,
          });
        }
      }
    }catch(error)
    {
        log.error("error",error.message);
    }
       if(errorMessage)
      {
      newRec.setValue({
        fieldId: "custbody_jj_error_field",
        value: errorMessage,
      });
    }


  }

 


  return { beforeSubmit };
});
