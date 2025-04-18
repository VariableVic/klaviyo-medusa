import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { IKlaviyoService, KLAVIYO_MODULE } from "../../types/klaviyo";
import { v4 as uuidv4 } from "uuid";
import { StoreOrder } from "@medusajs/types";

const sendOrderEventStep = createStep(
  "send-order-event",
  async (order: StoreOrder, context) => {
    const klaviyoService =
      context.container.resolve<IKlaviyoService>(KLAVIYO_MODULE);

    // Extract email from the order
    // In Medusa v2, we would need to access the customer email from order data
    const email = order.email;

    // If we don't have customer email information, we can't send the event
    if (!email) {
      return new StepResponse("No customer email available", null);
    }

    // Construct the event payload
    const eventPayload = {
      properties: {
        orderId: order.id,
        orderNumber: order.display_id || order.id,
        total: order.total,
        subtotal: order.subtotal,
        tax: order.tax_total,
        currency: order.currency_code,
        shipping: order.shipping_total,
        items: (order.items || []).map((item) => ({
          id: item.variant_id,
          title: item.title,
          quantity: item.quantity,
          price: item.unit_price,
          product_id: item.product_id,
          thumbnail: item.thumbnail,
        })),
      },
      metric: {
        data: {
          type: "metric",
          attributes: {
            name: "Placed Order",
          },
        },
      },
      profile: {
        data: {
          type: "profile",
          attributes: {
            email,
          },
        },
      },
      unique_id: uuidv4(),
    };

    // Send the event to Klaviyo
    const event = await klaviyoService.createEvent(eventPayload);

    return new StepResponse(
      `Order placed event sent to Klaviyo for order ${order.id}`,
      event
    );
  }
);

export default sendOrderEventStep;
