import { test } from '@japa/runner'
import { generateTestData } from './lib.js'
import { renkoChart } from "../../dist/index.js"

test.group('Renko Chart', () => {

    test('should generate the correct Renko chart data for a given price series', ({ assert }) => {
        // Generate test data for 30 days
        const testData = generateTestData(30)

        // Extract only the 'close' prices for the Renko chart input
        const prices = testData.map(item => item.close)

        // Define the brick size (e.g., 5.0)
        const brickSize = 5.0

        // Call the wasm function
        const result = renkoChart(prices, brickSize)

        // Check that the result contains prices
        assert.exists(result)
        assert.isAbove(result.length, 0)

        // Check that the price differences are multiples of the brick size
        result.forEach((price, index) => {
            if (index > 0) {
                const diff = Math.abs(result[index] - result[index - 1])
                assert.equal(diff % brickSize, 0, `The difference between prices at index ${index} must be a multiple of the brick size`)
            }
        })
    })

    test('should handle an empty price list gracefully', ({ assert }) => {
        try {
            renkoChart([], 5.0)
            assert.fail('The function did not throw an error for an empty price list')
        } catch (error) {
            assert.equal(error.message, 'Prices vector must not be empty.')
        }
    })

    test('should handle invalid brick size', ({ assert }) => {
        const testData = generateTestData(30)
        const prices = testData.map(item => item.close)

        try {
            renkoChart(prices, -5.0)
            assert.fail('The function did not throw an error for an invalid brick size')
        } catch (error) {
            assert.equal(error.message, 'brick_size amount must be greater than 0.')
        }
    })

    test('should not generate bricks if movement is insufficient', ({ assert }) => {
        const prices = [100, 101, 102, 103, 104, 105]

        // If the movement is too small to generate a brick
        const brickSize = 10.0
        const result = renkoChart(prices, brickSize)

        assert.deepEqual(result, [prices[0]], 'No bricks should be generated for insufficient movement')
    })

    test('should generate bricks when there are sufficient price movements', ({ assert }) => {
        const testData = generateTestData(30)
        const prices = testData.map(item => item.close)

        // Test with sufficient movement to generate bricks
        const brickSize = 5.0
        const result = renkoChart(prices, brickSize)

        assert.isAbove(result.length, 1, 'At least one brick should be generated')
        assert.deepEqual(result[0], prices[0], 'The first value must be equal to the first price')
    })

    test('should return an empty array if all prices are the same', ({ assert }) => {
        // If all prices are the same, no bricks should be generated
        const prices = [100, 100, 100, 100, 100]
        const brickSize = 5.0
        const result = renkoChart(prices, brickSize)

        assert.deepEqual(result, [100], 'The array should contain only the starting value if all prices are identical')
    })
})
