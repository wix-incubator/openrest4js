import _ from 'lodash';
import ChargeV2Helper from './ChargeV2.js';

export default {

    /**
     * @return The orderCharges (ChargesV2) that should be added to the order
     */
    getOrderCharges:function({order, chargesV2}) {

        let orderCharges = [];
        let prevOrderCharges = [];

        do {
            prevOrderCharges = orderCharges;

            orderCharges = _.compact(_.map(chargesV2, charge => {

                const isApplicable = ChargeV2Helper.isApplicable({
                    charge          : charge,
                    deliveryTime    : order.delivery.time,
                    deliveryType    : order.delivery.type,
                    orderItems      : order.orderItems,
                    source          : order.source,
                    platform        : order.platform
                });

                if (!isApplicable) {
                    if (charge.mandatory) {
                        return {chargeId:charge.id, amount:0};
                    } else {
                        return null;
                    }
                } else {
                    return {
                        chargeId:charge.id,
                        amount:ChargeV2Helper.calculateAmount({charge, orderItems:order.orderItems, orderCharges})
                    };
                }
            }));

            orderCharges = _.sortBy(orderCharges, 'chargeId');
            prevOrderCharges = _.sortBy(prevOrderCharges, 'chargeId');

        } while (!_.isEqual(orderCharges, prevOrderCharges));

        return orderCharges;
    }
}
