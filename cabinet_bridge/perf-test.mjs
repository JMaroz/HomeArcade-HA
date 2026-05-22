import http from 'http';

const URL = 'http://localhost:5000/api/roms';
const CONCURRENT_REQUESTS = 5;
const ITERATIONS = 3;

async function measureRequest() {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    http.get(URL, (res) => {
      let size = 0;
      res.on('data', (chunk) => { size += chunk.length; });
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({ duration, size: (size / 1024 / 1024).toFixed(2) + ' MB' });
      });
    }).on('error', reject);
  });
}

async function runBenchmark() {
  console.log(`🚀 Starting Performance Benchmark...`);
  console.log(`Target: ${URL}`);
  console.log(`Concurrency: ${CONCURRENT_REQUESTS}, Iterations: ${ITERATIONS}\n`);

  for (let i = 1; i <= ITERATIONS; i++) {
    console.log(`Iteration ${i}: Running ${CONCURRENT_REQUESTS} parallel requests...`);
    const startTime = Date.now();
    const results = await Promise.all(Array.from({ length: CONCURRENT_REQUESTS }, measureRequest));
    const totalTime = Date.now() - startTime;
    
    const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / results.length;
    console.log(`  - Average Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`  - Payload Size: ${results[0].size}`);
    console.log(`  - Total Iteration Time: ${totalTime}ms\n`);
  }
}

runBenchmark().catch(console.error);
