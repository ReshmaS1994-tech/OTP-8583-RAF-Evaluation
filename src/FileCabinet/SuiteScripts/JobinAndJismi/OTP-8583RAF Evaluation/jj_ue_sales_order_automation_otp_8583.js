/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * /**********************************************************************************************
${OTP-8583}:{RAF Evaluation}
*
*
**************************************************************************************************
*
*Author:Jobin and Jismi IT Services
*
*Date Created:25-06-2025
*
*Description:This function is designed to automatically generate an invoice from a related Sales 
Order when an Item Fulfillment record reaches the "Shipped" status.

*REVISION HISTORY
*@version 1.0 25-06-2025 :Created the initial build by JJ0402
*/
define(["N/log", "N/record", "N/search"]
/**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */, (log, record, search) => {
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
    } catch (error) {
      log.error("error", error.message);
      errorMessage = error.message;
    }
  };

  /**
   * Transforms a Sales Order into an Invoice when the associated Item Fulfillment status is 'Shipped'.
   * It removes unfulfilled line items (quantity = 0) from the invoice and attaches the new invoice ID
   * back to the fulfillment record in the custom field `custbody_jj_invoice_number`.
   * If any error occurs during this process, the error message is logged and optionally stored in
   * the custom field `custbody_jj_error_field`.
   *
   * @param {Object} scriptContext - The context object passed into the User Event Script entry point.
   * @param {Record} scriptContext.newRecord - The current fulfillment record being processed.
   */

  function transformToInvoiceIfShipped(scriptContext) {
    try {
      let newRec = scriptContext.newRecord;

      const fulfillmentstatus = newRec.getText({ fieldId: "status" });
      let soId = newRec.getValue({ fieldId: "createdfrom" });
      if (fulfillmentstatus === "Shipped") {
        var objRecord = record.transform({
          fromType: record.Type.SALES_ORDER,
          fromId: soId,
          toType: record.Type.INVOICE,
          isDynamic: true,
        });

        var lineCount = objRecord.getLineCount({ sublistId: "item" });
        for (var i = lineCount - 1; i >= 0; i--) {
          var qty = objRecord.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: i,
          });
          if (!qty || qty == 0) {
            objRecord.removeLine({
              sublistId: "item",
              line: i,
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
    } catch (error) {
      log.error("error", error.message);
    }
    if (errorMessage) {
      newRec.setValue({
        fieldId: "custbody_jj_error_field",
        value: errorMessage,
      });
    }
  }

  return { beforeSubmit };
});
