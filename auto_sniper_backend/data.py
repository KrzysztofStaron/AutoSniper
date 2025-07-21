import json
import matplotlib.pyplot as plt
import numpy as np # Import numpy
from scipy import stats # Import scipy.stats

# Specify encoding='utf-8' to handle potential unicode characters
combined_results = json.load(open("combined_results.json", encoding='utf-8'))

"""
it's an array of   {
    "title": "NOWY PRZEGLAD ładna w db stanie Corolla 1.4 zamiana",
    "price": "2 899 zł",
    "location": "Poznań, Stare Miasto - Odświeżono dnia 01 maja 2025",
    "link": "https://www.olx.pl/d/oferta/nowy-przeglad-ladna-w-db-stanie-corolla-1-4-zamiana-CID5-ID15tSzW.html?reason=extended_search_extended_s2v",
    "mileage": " 290 000 km",
    "fitness": {
      "priceFitness": 0.8328124943680908,
      "mileageFitness": -0.3917753396246778
    }
  }
"""

# Extract data points
price_fitness = [item['fitness']['priceFitness'] for item in combined_results]
mileage_fitness = [item['fitness']['mileageFitness'] for item in combined_results]
total_fitness = [item['fitness']['totalFitness'] for item in combined_results] # Extract totalFitness

# --- Normality Test for Total Fitness --- 
# Check if there's enough data for the test (Shapiro needs at least 3 samples)
if len(total_fitness) >= 3:
    shapiro_test_stat, shapiro_p_value = stats.shapiro(total_fitness)
    print("\n--- Shapiro-Wilk Normality Test for Total Fitness ---")
    print(f"Test Statistic: {shapiro_test_stat:.4f}")
    print(f"P-value: {shapiro_p_value:.4f}")
    
    alpha = 0.05
    if shapiro_p_value > alpha:
        print(f"Interpretation: P-value ({shapiro_p_value:.4f}) > {alpha}. Fail to reject H0. Sample looks Gaussian (normal).")
    else:
        print(f"Interpretation: P-value ({shapiro_p_value:.4f}) <= {alpha}. Reject H0. Sample does not look Gaussian (normal).")
    print("-----------------------------------------------------")
else:
    print("\nNot enough data points (need >= 3) to perform Shapiro-Wilk test.")

# Min-max scaling function
def min_max_scale(data):
    min_val = min(data)
    max_val = max(data)
    # Avoid division by zero if all values are the same
    if max_val == min_val:
        return [0.0] * len(data)
    return [(x - min_val) / (max_val - min_val) for x in data]

# Apply scaling
scaled_price_fitness = min_max_scale(price_fitness)
scaled_mileage_fitness = min_max_scale(mileage_fitness)
# Note: total_fitness is already calculated based on scaled values in search.ts,
# so we don't scale it again here. We plot its distribution directly.

# Calculate linear regression (y = ax + b)
a, b = np.polyfit(scaled_price_fitness, scaled_mileage_fitness, 1)

# Print the slope (a factor)
print(f"Linear Regression Slope (a factor): {a}")

# Generate points for the regression line
line_x = np.array(plt.xlim()) # Use current x-axis limits for line endpoints
line_y = a * line_x + b

# Create the scatter plot using scaled values
plt.figure(figsize=(10, 6))
plt.scatter(scaled_price_fitness, scaled_mileage_fitness, alpha=0.6, label='Data points')

# Plot the regression line
plt.plot(line_x, line_y, color='red', label=f'Linear Regression (y={a:.2f}x+{b:.2f})')

# Add labels and title
plt.title('Scaled Price Fitness vs. Scaled Mileage Fitness with Linear Regression')
plt.xlabel('Scaled Price Fitness (0=Min, 1=Max)')
plt.ylabel('Scaled Mileage Fitness (0=Min, 1=Max)')
plt.grid(True)
plt.legend() # Show legend

# Set axis limits to be slightly outside 0-1 for better visibility
plt.xlim(-0.05, 1.05)
plt.ylim(-0.05, 1.05)

# Show the plot
# plt.show() # Comment out or remove if showing plots together at the end

# --- Histogram for Total Fitness --- 

plt.figure(figsize=(10, 6)) # Create a new figure for the histogram

# Plot the histogram and store bin edges and counts
n_counts, bins, patches = plt.hist(total_fitness, bins=20, color='skyblue', edgecolor='black', alpha=0.7, label='Actual Distribution') # Adjust bins as needed

# Calculate mean and standard deviation for the Gaussian fit
mu, sigma = np.mean(total_fitness), np.std(total_fitness)

# Calculate the PDF of the normal distribution
# Generate points for the fitted curve
x_curve = np.linspace(bins[0], bins[-1], 100)
pdf = stats.norm.pdf(x_curve, mu, sigma)

# Scale the PDF to match the histogram's scale (counts)
# Scaling factor = N * bin_width
bin_width = bins[1] - bins[0]
scaled_pdf = pdf * len(total_fitness) * bin_width

# Plot the fitted Gaussian curve
plt.plot(x_curve, scaled_pdf, 'r--', linewidth=2, label=f'Gaussian Fit (μ={mu:.2f}, σ={sigma:.2f})')

plt.title('Distribution of Total Fitness Scores with Gaussian Fit')
plt.xlabel('Total Fitness (Distance to [1,1])')
plt.ylabel('Number of Listings')
plt.grid(axis='y', alpha=0.75)
plt.legend() # Show legend including the fit

# Show both plots
plt.show()
