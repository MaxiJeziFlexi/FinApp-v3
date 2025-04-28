const buildPredictionModel = () => {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [4] }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    return model;
  };
  
  const trainModel = async (historicalData) => {
    const model = buildPredictionModel();
    const xs = tf.tensor2d(historicalData.map(d => [d.income, d.expenses, d.investments, d.debt]));
    const ys = tf.tensor1d(historicalData.map(d => d.netWorth));
    
    await model.fit(xs, ys, { epochs: 100 });
    return model;
  };