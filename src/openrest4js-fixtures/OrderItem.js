export default function createOrderItem() {
    let fixture = init();

    function init() {
        return {};
    }

    return {
        itemId(itemId) {
            fixture.itemId = itemId;
            return this;
        },

        price(price) {
            fixture.price = price;
            return this;
        },

        val() {
            return fixture;
        }
    };
}

