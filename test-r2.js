// Test R2 connection using fetch directly
async function testR2() {
  try {
    console.log('🔍 Testing R2 connection...')

    // Test 1: Test with S3-compatible endpoint format
    console.log('🌐 Testing S3-compatible endpoint...')
    const s3EndpointResponse = await fetch(
      'https://dev.0be4137bad787f8300dd055aa30d7454.r2.cloudflarestorage.com',
      {
        method: 'HEAD',
      }
    )

    console.log(
      'S3 endpoint response:',
      s3EndpointResponse.status,
      s3EndpointResponse.statusText
    )

    // Test 2: Test with the jurisdiction-specific endpoint
    console.log('🌍 Testing jurisdiction-specific endpoint...')
    const jurisdictionResponse = await fetch(
      'https://0be4137bad787f8300dd055aa30d7454.r2.cloudflarestorage.com/dev',
      {
        method: 'HEAD',
      }
    )

    console.log(
      'Jurisdiction endpoint response:',
      jurisdictionResponse.status,
      jurisdictionResponse.statusText
    )

    // Test 3: Test with public-read bucket (if configured)
    console.log('📁 Testing public bucket access...')
    try {
      const publicResponse = await fetch(
        'https://dev.0be4137bad787f8300dd055aa30d7454.r2.cloudflarestorage.com',
        {
          method: 'GET',
        }
      )

      console.log(
        'Public access response:',
        publicResponse.status,
        publicResponse.statusText
      )

      if (publicResponse.ok) {
        console.log('✅ Public bucket access working')
      } else {
        console.log('ℹ️ Bucket is not public (this is normal)')
      }
    } catch (publicError) {
      console.log('Public access error (expected):', publicError.message)
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

testR2()
